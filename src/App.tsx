import styles from "./App.module.scss";
import { Button, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  PublicKeyCredentialType,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";
const rpName = "passkey-sample";
const rpId = "localhost";

function base64URLEncode(pureBase64: string): string {
  return pureBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Base64URLデコード
function base64URLDecode(base64url: string): string {
  base64url = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = 4 - (base64url.length % 4);
  if (padding !== 4) {
    base64url += "=".repeat(padding);
  }
  return base64url;
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  let binary = "";
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
  const onRegister = async () => {
    try {
      const { credentials, challenge } = await createRegistrationCredential();
      const authResponse =
        credentials.response as AuthenticatorAttestationResponse;

      const serverRequest: RegistrationResponseJSON = {
        id: credentials.id,
        rawId: credentials.id,
        type: credentials.type as PublicKeyCredentialType,
        clientExtensionResults: credentials.getClientExtensionResults(),
        response: {
          clientDataJSON: arrayBufferToBase64URL(authResponse.clientDataJSON),
          attestationObject: arrayBufferToBase64URL(
            authResponse.attestationObject
          ),
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

      alert('パスキーの登録に成功しました');
    } catch (e) {
      console.error(e);
    }
  };

  const createRegistrationCredential = async () => {
    try {
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
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  // パスキーログイン処理
  const onAuthorize = async () => {
    try {
      const { credentials, challenge } = await createAuthenticationCredential();
      // const authResponse =
      //   credentials.response as AuthenticatorAttestationResponse;

      if (credentials === null) {
        alert("認証に失敗しました");
        return;
      }

      const publicKeyCredential = credentials as PublicKeyCredential;
      const authenticatorAssertionResponse =
        publicKeyCredential.response as AuthenticatorAssertionResponse;

      const serverRequest: AuthenticationResponseJSON = {
        id: publicKeyCredential.id,
        rawId: publicKeyCredential.id,
        type: publicKeyCredential.type as PublicKeyCredentialType,
        response: {
          authenticatorData: arrayBufferToBase64URL(
            authenticatorAssertionResponse.authenticatorData
          ),
          clientDataJSON: arrayBufferToBase64URL(
            authenticatorAssertionResponse.clientDataJSON
          ),
          signature: arrayBufferToBase64URL(
            authenticatorAssertionResponse.signature
          ),
          userHandle: arrayBufferToBase64URL(
            authenticatorAssertionResponse.userHandle!
          ),
        },
        clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
      };

      await axios({
        url: `${API_BASE_URL}/passkey/authenticate`,
        headers: {
          Challenge: challenge,
          "Content-Type": "application/json",
        },
        method: "post",
        data: serverRequest,
      });

      alert("パスキー認証に成功しました");
    } catch (e) {
      console.error(e);
    }
  };

  const createAuthenticationCredential = async () => {
    try {
      const options = await generateAuthenticationOptions({
        rpID: rpId,
      });

      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: base64URLToArrayBuffer(options.challenge),
          rpId: options.rpId,
          userVerification: "preferred",
          timeout: options.timeout,
        },
        //mediation: "conditional",
      });
      console.log(credentials);
      return {
        credentials,
        challenge: options.challenge,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <h1 className={styles.title}>パスキーデモサイト</h1>
      <div className={styles.layout}>
        <Button onClick={onRegister} size="xl" className={styles.button}>
          パスキー新規登録
        </Button>
        <Button onClick={onAuthorize} size="xl" className={styles.button}>
          パスキーログイン
        </Button>
      </div>
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
