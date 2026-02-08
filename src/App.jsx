import React, { useState, useEffect, useRef } from 'react';


const App = () => {
  const [isOn, setIsOn] = useState(false);
  const ws = useRef(null);


  useEffect(() => {
    // 建立連線
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");


    socket.onopen = () => {
      console.log("已連線到伺服器");
    };


    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsOn(data.isOn); // 接收伺服器廣播並更新
      } catch (e) {
        console.error("解析訊息錯誤", e);
      }
    };


    // 將 socket 存入 ref
    ws.current = socket;


    // --- 修改部分：更安全的清除連線邏輯 ---
    return () => {
      // 只有當連線狀態是 OPEN 或 CONNECTING 時才執行關閉
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, []);


  const handleClick = () => {
    // 計算預期的新狀態 (Toggle)
    const newState = !isOn;


    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // 只發送資料，不直接 setIsOn，等待伺服器廣播回來才變色
      ws.current.send(JSON.stringify({ isOn: newState }));
    } else {
      console.warn("尚未連線到伺服器，無法發送指令");
    }
  };


  const containerStyle = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flexDirection: 'column' // 讓文字排在按鈕下面
  };


  const buttonStyle = {
    backgroundColor: isOn ? 'red' : 'green',
    color: 'white',
    padding: '15px 30px',
    fontSize: '20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '100px'
  };


  return (
    <div style={containerStyle}>
      <button style={buttonStyle} onClick={handleClick}>
        {isOn ? 'ON' : 'OFF'}
      </button>
      <div style={{marginTop: '20px', color: '#666'}}>
        {/* 顯示連線狀態，方便除錯 */}
        Status: {ws.current && ws.current.readyState === 1 ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};


export default App;



