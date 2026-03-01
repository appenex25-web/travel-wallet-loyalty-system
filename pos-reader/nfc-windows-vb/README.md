# NFC Reader Bridge (Visual Basic .NET)

Reads **NTAG** (and compatible) card UIDs from the ACR122U via Windows PC/SC and POSTs them to the pos-reader helper so the POS web app can pick them up.

No Node.js build tools or nfc-pcsc required—just .NET 8.

## Requirements

- **.NET 8 SDK** (or runtime): [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **ACR122U** connected (Windows will use built-in drivers)
- **pos-reader** server running: in the `pos-reader` folder run `npm start`

## Build

```batch
cd pos-reader\nfc-windows-vb
dotnet build -c Release
```

Exe: `bin\Release\net8.0\NfcReader.exe`

## Run

1. Start the pos-reader server: `cd pos-reader` then `npm start`.
2. Run the bridge: `bin\Release\net8.0\NfcReader.exe` (or `dotnet run` from this folder).
3. Open the POS page in the browser and click **Listen to reader**.
4. Tap an NTAG card on the ACR122U—the UID will be sent and the POS will identify the customer.

## Card support

Uses the standard **GET DATA (UID)** APDU `FF CA 00 00 00`, which works with:

- **NTAG** (NTAG213, NTAG215, NTAG216, etc.)
- Mifare Ultralight / Ultralight C
- Other Type 2 tags that return UID via this command

The ACR122U handles the protocol; the bridge just sends the APDU and forwards the UID to the pos-reader.
