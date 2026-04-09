import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Web3Provider } from "../context/Web3Context";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Web3Provider>
        <Component {...pageProps} />
      </Web3Provider>
    </AuthProvider>
  );
}