
import styles from "./App.module.scss";
import { Button, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
  AuthenticatorTransportFuture,
  generateRegistrationOptions,
  PublicKeyCredentialType,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";

function base64URLEncode(pureBase64: string): string {
  return pureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Base64URLデコード
function base64URLDecode(base64url: string): string {
  base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64url.length % 4);
  if (padding !== 4) {
      base64url += '='.repeat(padding);
  }
  return base64url;
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64URLEncode(base64);
}

// Base64URL => ArrayBuffer
function base64URLToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64URLDecode(base64url);
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function App() {
  const onClick = async () => {
    try {
      const {credentials, challenge} = await createPasskeyCredential();
      const authResponse =
        credentials.response as AuthenticatorAttestationResponse;

      const serverRequest: RegistrationResponseJSON = {
        id: credentials.id,
        rawId: credentials.id,
        type: credentials.type as PublicKeyCredentialType,
        clientExtensionResults: credentials.getClientExtensionResults(),
        response: {
          clientDataJSON: arrayBufferToBase64URL(authResponse.clientDataJSON),
          attestationObject: arrayBufferToBase64URL(authResponse.attestationObject),
          transports:
            authResponse.getTransports() as AuthenticatorTransportFuture[],
        },
      };

      await axios({
        url: `${API_BASE_URL}/passkey/register`,
        headers: {
          Challenge: challenge,
          "Content-Type": "application/json",
        },
        method: "post",
        data: serverRequest,
      });
    } catch (e) {
      console.error(e);
    }
    // TODO send credentials to server
  };

  function base64url2ab(base64url: string) {
    return base642ab(base64url2base64(base64url));
  }

  function base642ab(base64: string) {
    const str = window.atob(base64);
    const len = str.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function base64url2base64(base64url: string) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding > 0) {
      return base64 + '===='.slice(padding);
    } 
    return base64;
  }

  const createPasskeyCredential = async () => {
    try {
      const rpName = "passkey-sample";
      const rpId = "localhost";
      const userId = new Uint8Array(32);
      const user = "user1";
      const authenticatorSelection: AuthenticatorSelectionCriteria = {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
      };

      const attestationType = "none";

      const options = await generateRegistrationOptions({
        rpName: rpName,
        rpID: rpId,
        userID: userId,
        userName: user,
        userDisplayName: user,
        attestationType: attestationType,
        excludeCredentials: [],
        authenticatorSelection: authenticatorSelection,
      });

      const credentials = (await navigator.credentials.create({
        publicKey: {
          challenge: base64URLToArrayBuffer(options.challenge),
          rp: options.rp,
          user: {
            id: base64URLToArrayBuffer(options.user.id),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: options.authenticatorSelection,
          timeout: options.timeout,
          attestation: options.attestation,
        },
      })) as PublicKeyCredential;
      console.log(credentials);
      return {
        credentials,
        challenge: options.challenge,
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <Button onClick={onClick}>パスキー新規登録</Button>
      {/* <div>
        <div className={styles.test}>test</div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </ChakraProvider>
  );
}

export default App;
