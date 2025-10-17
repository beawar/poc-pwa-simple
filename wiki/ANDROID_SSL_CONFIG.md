# Complete Guide: Testing PWA Push Notifications on a Local Android Emulator

Testing web push notifications locally is challenging because they require a secure (HTTPS) context and a way for the Android emulator to connect to your `localhost` server using a trusted domain name. This guide walks you through the entire process, including the necessary security workarounds for modern Android versions.

### \#\# Prerequisites

- **Android Studio:** Installed with the Android SDK and emulator.
- **`mkcert`:** A tool for creating locally-trusted development certificates.
- **Node.js & Dev Server:** A local web server for your PWA (e.g., Vite, Webpack Dev Server).
- **A PWA:** Your application code with a functional service worker.

---

### \#\# Part 1: Create a Secure (HTTPS) Local Environment

Push notifications require a secure origin. We'll use `mkcert` to create an SSL certificate for a custom local hostname, which is more reliable than using an IP address.

1.  **Choose a Hostname:** We'll use `dev.local` for this guide.

2.  **Generate the Certificate:** Run `mkcert` to create a certificate that is valid for your custom hostname and `localhost`.

    ```bash
    mkcert dev.local localhost 127.0.0.1 ::1
    ```

    This will create `dev.local+3.pem` (certificate) and `dev.local+3-key.pem` (key) files (or similar names).

3.  **Configure Your Dev Server:** Update your server configuration to use the new certificate and to be accessible on your local network.

    > **Example for `vite.config.js`:**
    >
    > ```javascript
    > import fs from 'fs';
    >
    > export default {
    >   server: {
    >   host: '0.0.0.0', // Listen on all network interfaces
    >   https: {
    >     key: fs.readFileSync('./dev.local+3-key.pem'),
    >     cert: fs.readFileSync('./dev.local+3.pem'),
    >   }
    > }
    > ```

---

### \#\# Part 2: Configure the Android Emulator

You need a debuggable emulator that trusts your custom `mkcert` Certificate Authority (CA).

1.  **Create a Debuggable AVD:**

    - In Android Studio, go to **Tools \> AVD Manager**.
    - Click **+ Create Virtual Device...**.
    - Choose a hardware profile.
    - On the "System Image" screen, select an image whose **Target** name includes **"(Google APIs)"**. **Do not use "(Google Play)" images**, as they are production builds and cannot be rooted.

2.  **Install the `mkcert` Root Certificate:**

    - Find your `mkcert` root CA folder:
      ```bash
      mkcert -CAROOT
      ```
    - Navigate to that folder and find `rootCA.pem`.
    - Rename it to have a `.crt` extension, e.g., `myCA.crt`.
    - Start your new "Google APIs" emulator.
    - **Drag and drop the `myCA.crt` file** directly onto the emulator screen.
    - Go to **Settings \> Security \> Encryption & credentials \> Install a certificate \> CA certificate**.
    - Select **Install anyway** and choose the `myCA.crt` file from the `Downloads` folder.

---

### \#\# Part 3: Enable Local Hostname Resolution

This is the most complex part. You must modify the emulator's `hosts` file to point `dev.local` to your computer's IP address. This requires a series of security-disabling commands on modern Android (API 30+).

1.  **Find Your Computer's Local IP:**

    - **Windows:** `ipconfig` (find the IPv4 Address)
    - **macOS/Linux:** `ip a` or `ifconfig` (find the `inet` address)
    - _Let's assume your IP is `192.168.1.100`._

2.  **Launch the Emulator with a Writable System:**

    - Navigate to your Android SDK's `emulator` directory (e.g., `~/Library/Android/sdk/emulator/`).
    - Launch your AVD from the terminal with the `-writable-system` flag:
      ```bash
      ./emulator -avd Your_AVD_Name -writable-system
      ```

3.  **Make the System Writable:** In a new terminal, run the following sequence.

        ```bash
        # 1. Gain root access
        adb root

        # 2. Disable Android Verified Boot (only needs to be run once per AVD)
        adb shell avbctl disable-verification
        adb reboot

        # 3. Wait for the emulator to fully restart...

        # 4. Regain root and remount the system as read-write
        adb root
        adb remount

        # 5. Pull the hosts file from the emulator to your computer
        adb pull /system/etc/hosts .
        ```

    Edit the hosts file you just pulled with a text editor. Add a new line at the bottom mapping your IP to your chosen hostname:

        ```bash
        127.0.0.1       localhost
        ::1             ip6-localhost

        # Add your custom host here
        192.168.1.42    dev.local
        ```

    Push the modified hosts file back to the emulator:

    ```bash
    adb push hosts /system/etc/hosts
    ```

---

### \#\# Part 4: Testing the Notifications

1.  **Start your local dev server.**
2.  In the emulator's Chrome browser, navigate to `https://dev.local:<your_port>`. You should see a secure padlock icon.
3.  Install the PWA to the home screen.
4.  Grant notification permissions when prompted by your PWA.
5.  Trigger a push notification from your application's backend.
6.  The notification should appear on the emulator.

---

### \#\# 🚨 Troubleshooting Guide

If you encounter an error, find it in the list below.

| Problem / Error Message                                 | Solution                                                                                                                                                                       |
| :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adbd cannot run as root in production builds`          | You are using a **"(Google Play)"** system image. Create a new AVD with a **"(Google APIs)"** image as described in Part 2.                                                    |
| `Device must be bootloader unlocked` (on `adb remount`) | You are on Android 11+ and need to disable Verified Boot. Follow the `adb shell avbctl disable-verification` and `adb reboot` steps in Part 3.                                 |
| `Error writing to partition 'vbmeta'` (on `avbctl`)     | The emulator was not started with a writable disk. You **must** launch it from the command line with the `-writable-system` flag.                                              |
| `Read-only file system` (on `adb push`)                 | You missed the `adb remount` command. After rebooting and running `adb root`, you must run `adb remount` before pushing the file.                                              |
| `ERR_CERT_COMMON_NAME_INVALID`                          | The certificate doesn't match the URL. Ensure you generated the cert with the correct hostname (`dev.local`) and are accessing that exact URL in the browser.                  |
| `protocol fault` or other connection errors             | Restart the ADB server: `adb kill-server && adb start-server`. If you have multiple devices connected, target the emulator specifically with `adb -s emulator-5554 <command>`. |
