import "@/styles/globals.css";
import theme from "@/theme/theme";
import { ConfigProvider } from "antd";

export default function App({ Component, pageProps }) {
  return (
    <ConfigProvider theme={theme}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
