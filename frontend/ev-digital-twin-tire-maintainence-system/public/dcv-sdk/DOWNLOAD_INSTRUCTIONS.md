# DCV Web Client SDK — Download Instructions

The DCV Web Client SDK is required for the browser live view feature but cannot be redistributed in this repository due to its license terms.

## Download Steps

1. Visit the [Amazon DCV Web Client SDK documentation](https://docs.aws.amazon.com/dcv/latest/userguide/client-web.html)

2. Download the latest DCV Web Client SDK package

3. Extract the contents into this directory (`public/dcv-sdk/`) so the structure looks like:

```
public/dcv-sdk/
├── dcv-ui/
│   ├── dcv-ui.js
│   ├── EULA.txt
│   ├── README.md
│   └── third-party-licenses.txt
├── dcvjs-esm/
│   ├── dcv/
│   │   ├── broadwayh264decoder-worker.js
│   │   ├── jsmpegdecoder-worker.js
│   │   ├── lz4decoder-worker.js
│   │   └── microphoneprocessor.js
│   ├── EULA.txt
│   ├── README.md
│   └── third-party-licenses.txt
└── dcvjs-umd/
    ├── dcv/
    │   ├── broadwayh264decoder-worker.js
    │   ├── jsmpegdecoder-worker.js
    │   ├── lz4decoder-worker.js
    │   └── microphoneprocessor.js
    └── third-party-licenses.txt
```

4. After placing the SDK files, rebuild the frontend:
```bash
npm run build
```

## Note

The DCV Web Client SDK is governed by its own End User License Agreement (EULA). Review the EULA.txt included in the SDK package before use.
