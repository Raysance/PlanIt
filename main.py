import os
import json
import redis
import uuid
import random
import string
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, Response, Cookie
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="PlanIt API")
app.mount("/planit/static", StaticFiles(directory="static"), name="static")

REDIS_PLANIT_QUEUE = 9

def get_redis_connection():
    redis_path = str(os.environ.get('REDIS_CONF', 'redis_conf.json'))
    try:
        with open(redis_path, 'r', encoding='utf-8') as file:
            varia = json.load(file)
            host = varia.get("host", "localhost")
            port = varia.get("port", 6379)
            password = varia.get("password", None)
            return redis.Redis(host=host, port=port, db=REDIS_PLANIT_QUEUE, password=password, decode_responses=True)
    except FileNotFoundError:
        # Fallback for local testing if file is missing
        return redis.Redis(host='localhost', port=6379, db=REDIS_PLANIT_QUEUE, decode_responses=True)
    except Exception as e:
        print(f"Error connecting to Redis: {e}")
        return redis.Redis(host='localhost', port=6379, db=REDIS_PLANIT_QUEUE, decode_responses=True)

class LoginRequest(BaseModel):
    code: str

class Plan(BaseModel):
    id: str = ""
    name: str
    time_start: str = ""
    time_end: str = ""
    term: str # short, medium, long
    details: str
    created_at: str = ""
    completed: bool = False
    review: str = ""

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@app.get("/planit", response_class=HTMLResponse)
async def serve_index():
    try:
        with open("template/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "template/index.html not found"

@app.post("/planit/api/login")
async def login(req: LoginRequest, response: Response):
    r = get_redis_connection()
    code = req.code.strip()
    
    if not code:
        # Create new
        code = generate_code()
        # Initialize empty plan list
        r.set(f"planit:{code}", json.dumps([]))
        response.set_cookie(key="planit_code", value=code, max_age=31536000, httponly=True, path="/")
        return {"message": "创建成功", "code": code}
    
    # Check if exists
    data = r.get(f"planit:{code}")
    if data is None:
        raise HTTPException(status_code=404, detail="口令不存在")
    
    response.set_cookie(key="planit_code", value=code, max_age=31536000, httponly=True, path="/")
    return {"message": "登录成功", "code": code}

@app.post("/planit/api/logout")
async def logout(response: Response):
    response.delete_cookie(key="planit_code", path="/")
    return {"message": "登出成功"}

@app.get("/planit/api/data")
async def get_data(planit_code: Optional[str] = Cookie(None)):
    if not planit_code:
        raise HTTPException(status_code=401, detail="未登录")
    
    r = get_redis_connection()
    data = r.get(f"planit:{planit_code}")
    
    if data is None:
         raise HTTPException(status_code=401, detail="口令已失效")
         
    return {"plans": json.loads(data), "code": planit_code}

@app.post("/planit/api/plans")
async def add_plan(plan: Plan, planit_code: Optional[str] = Cookie(None)):
    if not planit_code:
        raise HTTPException(status_code=401, detail="未登录")
        
    r = get_redis_connection()
    data = r.get(f"planit:{planit_code}")
    if data is None:
         raise HTTPException(status_code=401, detail="口令已失效")
         
    plans = json.loads(data)
    plan.id = str(uuid.uuid4())
    plan.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    plans.append(plan.dict())
    
    r.set(f"planit:{planit_code}", json.dumps(plans))
    return {"message": "添加成功"}

@app.put("/planit/api/plans/{plan_id}")
async def edit_plan(plan_id: str, plan_update: Plan, planit_code: Optional[str] = Cookie(None)):
    if not planit_code:
        raise HTTPException(status_code=401, detail="未登录")
        
    r = get_redis_connection()
    data = r.get(f"planit:{planit_code}")
    if data is None:
         raise HTTPException(status_code=401, detail="口令已失效")
         
    plans = json.loads(data)
    found = False
    for i, p in enumerate(plans):
        if p["id"] == plan_id:
            # Update fields
            plans[i]["name"] = plan_update.name
            plans[i]["time_start"] = plan_update.time_start
            plans[i]["time_end"] = plan_update.time_end
            plans[i]["term"] = plan_update.term
            plans[i]["details"] = plan_update.details
            plans[i]["completed"] = plan_update.completed
            plans[i]["review"] = plan_update.review
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="计划不存在")
        
    r.set(f"planit:{planit_code}", json.dumps(plans))
    return {"message": "更新成功"}

@app.delete("/planit/api/plans/{plan_id}")
async def delete_plan(plan_id: str, planit_code: Optional[str] = Cookie(None)):
    if not planit_code:
        raise HTTPException(status_code=401, detail="未登录")
        
    r = get_redis_connection()
    data = r.get(f"planit:{planit_code}")
    if data is None:
         raise HTTPException(status_code=401, detail="口令已失效")
         
    plans = json.loads(data)
    plans = [p for p in plans if p["id"] != plan_id]
    
    r.set(f"planit:{planit_code}", json.dumps(plans))
    return {"message": "删除成功"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
