# 电子生日贺卡初版

## 运行方式
cd Desktop/生日贺卡
npm run dev      # 开发模式 http://localhost:5173
npm run build    # 生产构建 → dist/

##项目结构
生日贺卡/
├── index.html          # HTML骨架 + 所有DOM场景节点
├── src/
│   ├── style.css       # CSS变量、3D透视、场景样式、动画
│   ├── main.ts         # 主编排器：阶段状态机 + GSAP时间线
│   ├── card.ts         # 火漆印绘制、裂开动画、贺卡展开
│   ├── particles.ts    # Canvas蝴蝶 + 金粉粒子系统
│   ├── parchment.ts    # Canvas遮罩擦除显影 + 光斑光标
│   ├── final.ts        # 终章浮动文字 + 金色光点画布
│   └── audio.ts        # Web Audio API合成音效（默认静音）

##实现要点
模块	技术
贺卡空间感	CSS perspective:1200px + transform-style:preserve-3d + rotateY
浮动感	CSS @keyframes card-float，3D轴微旋
火漆印	Canvas createRadialGradient + Bezier点纹，GSAP keyframes抖动裂开
展开翻页	GSAP .to(cardLeft, {rotationY:-165}) 左右翻页
粒子散逸	纯Canvas RAF循环，10-14只蝴蝶（Bezier翅膀）+ 40粒金尘
显影交互	Canvas destination-out 渐变橡皮擦，32×32采样网格测量80%阈值
光斑光标	CSS radial-gradient伪元素，pointer-events:none
终章效果	GSAP入场 + CSS @keyframes shimmer/float-y 无限循环
音效	Web Audio API三层A大调合成pad + LFO颤音，无需外部音频文件
移动端	touch* 事件 + viewport user-scalable=no + clamp() 响应字号
