import React, { useState } from "react";
import MyButton from "./MyButton";



const users = [
  { name: "Kais Saied", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/85/President_Kais_Sa%C3%AFed_cropped.jpg", imageSize: 120 },
  { name: "Habib Bourguiba", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/34/Bourguiba_portrait_%28cropped%29.JPG", imageSize: 120 },
  { name: "Ben Ali", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnAKqUu1TGGxZexXlmtiF2SN0LjBoJy-khiQ&s.jpg", imageSize: 120 },
  { name: "Beji Caid El Sebsi", imageUrl: "https://www.atalayar.com/asset/thumbnail,1280,720,center,center/media/atalayar/images/2022/01/04/20220104143704059193.jpg", imageSize: 120 },
];

export function Profile({ user }) {
  if (!user) return null;
  return (
    <>
      <h1>{user.name}</h1>
      <img
        src={user.imageUrl}
        alt={"Photo of " + user.name}
        style={{ width: user.imageSize, height: user.imageSize, borderRadius: 10 }}
      />
    </>
  );
}

function App() {
  const [selectedUser, setSelectedUser] = useState(users[0]);

  // ✅ نقلنا useState هنا
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>مرحبا بك في مشروع React</h1>

      <Profile user={selectedUser} />

      {/* أزرار تغيير الصور */}
      <div style={{ marginTop: 20 }}>
        {users.map((user, index) => (
          <MyButton
            key={index}
            text={user.name}
            onClick={() => setSelectedUser(user)}
          />
        ))}
      </div>

      {/* Counters */}
      <div style={{ marginTop: 20 }}>
        <h1>Counters that update together</h1>
        <MyButton text={"Count: " + count} onClick={handleClick} ClassName="h" />

        <MyButton h.count ? text={"Count: " + count} onClick={handleClick} />
      </div>
    </div>
  );
}

export default App;