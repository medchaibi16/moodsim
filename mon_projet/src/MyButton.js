import React from "react";

function MyButton({ onClick, text }) {
    return <button onClick={onClick}>{text}</button>;
}

export default MyButton;