import base64url from "base64url";
import styles from "./App.module.scss";
import { Button, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
  AuthenticatorTransportFuture,
  PublicKeyCredentialType,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import axios from "axios";

const API_BASE_URL = "https://localhost:5174";

function App() {
  const onClick = async () => {
    try {
      const credentials = await createPasskeyCredential();
      const authResponse =
        credentials.response as AuthenticatorAttestationResponse;
      const serverRequest: RegistrationResponseJSON = {
        id: credentials.id,
        rawId: credentials.id,
        type: credentials.type as PublicKeyCredentialType,
        clientExtensionResults: credentials.getClientExtensionResults(),
        response: {
          clientDataJSON: base64url.encode(authResponse.clientDataJSON),
          attestationObject: base64url(authResponse.attestationObject),
          transports:
            authResponse.getTransports() as AuthenticatorTransportFuture[],
        },
      };

      await axios({
        url: API_BASE_URL,
        headers: {
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

  const createPasskeyCredential = async (): Promise<PublicKeyCredential> => {
    try {
      const credentials = (await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { id: "localhost", name: "passkey example" },
          user: { id: new Uint8Array(32), name: "user", displayName: "User" },
          pubKeyCredParams: [
            { type: "public-key", alg: -8 },
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: { userVerification: "required" },
          timeout: 60000,
          attestation: "direct",
        },
      })) as PublicKeyCredential;
      console.log(credentials);
      return credentials;
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
