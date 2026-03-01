' Read NTAG (and compatible) card UID from ACR122U via PC/SC and POST to pos-reader (localhost:31337).
' Run with pos-reader server running (npm start). Then use "Listen to reader" on the POS page.

Imports System
Imports System.Net.Http
Imports System.Text
Imports System.Threading
Imports PCSC

Module Program
    Private Const ReaderHelperUrl As String = "http://localhost:31337/uid"

    Sub Main(args As String())
        Console.WriteLine("NFC reader bridge (NTAG / ACR122U) -> " & ReaderHelperUrl)
        Console.WriteLine("Make sure pos-reader is running (npm start). Tap a card...")
        Console.WriteLine()

        Using client As New HttpClient()
            client.Timeout = TimeSpan.FromSeconds(5)
            While True
                Try
                    ReadAndPostUid(client)
                Catch ex As Exception
                    Console.WriteLine("Error: " & ex.Message)
                End Try
                Thread.Sleep(500)
            End While
        End Using
    End Sub

    Private Sub ReadAndPostUid(client As HttpClient)
        Using context As New SCardContext()
            context.Establish(SCardScope.System)

            Dim readers() As String = context.GetReaders()
            If readers Is Nothing OrElse readers.Length = 0 Then
                Console.WriteLine("No smart card readers found. Is ACR122U connected?")
                Return
            End If

            Dim readerName As String = Nothing
            For Each r As String In readers
                If r.IndexOf("ACR122", StringComparison.OrdinalIgnoreCase) >= 0 Then
                    readerName = r
                    Exit For
                End If
            Next
            If String.IsNullOrEmpty(readerName) Then readerName = readers(0)

            ' GET DATA (UID) APDU: FF CA 00 00 00 - works for NTAG and Mifare-compatible tags
            Dim sendApdu() As Byte = {&HFF, &HCA, &H0, &H0, &H0}

            Using reader As New SCardReader(context)
                Dim rc = reader.Connect(readerName, SCardShareMode.Shared, SCardProtocol.T0 Or SCardProtocol.T1)
                If rc <> SCardError.Success Then Return

                Dim recvBuf(259) As Byte
                Dim recvLen As Integer = recvBuf.Length
                rc = reader.Transmit(sendApdu, recvBuf, recvLen)
                reader.Disconnect(SCardReaderDisposition.Leave)

                If rc <> SCardError.Success Then Return
                If recvLen < 2 Then Return
                ' Response: UID bytes (4 or 7 for NTAG) then SW1 SW2 = 90 00
                If recvBuf(recvLen - 2) <> &H90 OrElse recvBuf(recvLen - 1) <> &H0 Then Return
                Dim uidLen As Integer = recvLen - 2
                If uidLen <= 0 Then Return

                Dim uidBytes(uidLen - 1) As Byte
                Array.Copy(recvBuf, uidBytes, uidLen)
                Dim uidHex As String = BitConverter.ToString(uidBytes).Replace("-", "").ToLowerInvariant()

                Dim json As String = "{""uid"":""" & uidHex & """}"
                Dim content As New StringContent(json, Encoding.UTF8, "application/json")
                Dim res As HttpResponseMessage = client.PostAsync(ReaderHelperUrl, content).GetAwaiter().GetResult()
                If res.IsSuccessStatusCode Then
                    Console.WriteLine("UID sent: " & uidHex)
                    Thread.Sleep(2000)  ' Avoid re-sending same card immediately
                Else
                    Console.WriteLine("POST failed: " & res.StatusCode.ToString())
                End If
            End Using
        End Using
    End Sub
End Module
