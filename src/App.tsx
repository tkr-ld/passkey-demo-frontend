import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import styles from "./App.module.scss";
import { Button, ChakraProvider, defaultSystem } from "@chakra-ui/react";

function App() {
  const onClick = async () => {
    console.log("onClick");
    const credentials = await navigator.credentials.create({
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
    });
    console.log(credentials)
    // TODO send credentials to server
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
