'use client';
import React from "react";
import App from "./App";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
});
const Home = () => {
  return (
    <div className={inter.className}>
      <App />
    </div>
  );
};

export default Home;
