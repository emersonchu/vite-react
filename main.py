from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware  # 1. 引入 CORS
from typing import List
import json


app = FastAPI()


# --- 2. 新增 CORS Middleware 設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發階段允許所有來源，避免連線被擋
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []


    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)


    def disconnect(self, websocket: WebSocket):
        # 加入防呆機制：確保要移除的連線真的在列表裡
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)


    async def broadcast(self, message: dict):
        # 避免在迭代時修改列表，使用複製的列表進行迭代 (雖非必須但較安全)
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # 若發送失敗(對方已斷線但還沒觸發 disconnect)，通常這裡可忽略或移除連線
                pass


manager = ConnectionManager()
global_state = {"isOn": False}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
   
    # 連線成功後，立刻發送目前狀態
    await websocket.send_json(global_state)
   
    try:
        while True:
            data = await websocket.receive_text()
            data_dict = json.loads(data)
           
            # 更新全域狀態
            global_state["isOn"] = data_dict["isOn"]
           
            # 廣播
            await manager.broadcast(global_state)
           
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("使用者已離線")
    except json.JSONDecodeError:
        print("收到非 JSON 格式資料")
