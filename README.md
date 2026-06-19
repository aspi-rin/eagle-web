# Eagle Web Viewer

Eagle Web Viewer 是一个本地 Eagle 图库网页浏览器。它直接读取 Eagle 的 `.library` 目录，在浏览器里展示文件夹树和图片瀑布流，支持查看缩略图/原图、包含子文件夹筛选，以及在设置里切换已挂载的图库。

## 功能

- 读取本地 Eagle `.library` 图库，不需要导入或同步数据
- 左侧文件夹树浏览，右侧图片瀑布流展示
- 支持包含子文件夹的图片筛选
- 点击图片可预览原图
- 支持 Docker 部署，并可配置多个 Eagle 图库

## 本地开发

后端和前端分别启动：

```bash
# 后端，默认 http://localhost:3000
cd backend
cp ../.env.example .env
# 编辑 backend/.env，把 EAGLE_LIBRARY 改成你的 .library 绝对路径
npm install
npm run dev
```

```bash
# 前端，默认 http://localhost:5173
cd frontend
npm install
npm run dev
```

前端会把 `/api/*` 请求代理到后端。

## Docker 部署

复制环境变量模板并填写 Eagle 图库路径：

```bash
cp .env.example .env
```

单图库可设置：

```env
EAGLE_LIBRARY_PATH=/path/to/your/Eagle.library
```

多图库可设置：

```env
EAGLE_LIBRARY_1_NAME=Library 1
EAGLE_LIBRARY_1_PATH=/path/to/your/First.library
EAGLE_LIBRARY_2_NAME=Library 2
EAGLE_LIBRARY_2_PATH=/path/to/your/Second.library
EAGLE_LIBRARY_3_NAME=Library 3
EAGLE_LIBRARY_3_PATH=/path/to/your/Third.library
```

启动服务：

```bash
docker compose up -d --build
```

访问：

```text
http://localhost:13003
```

停止服务：

```bash
docker compose down
```
