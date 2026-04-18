# TimeAxis 移动应用

一个基于 Expo 和 React Native 的跨平台移动应用，用于时间轴数据的展示、对比和交互。该应用支持 iOS、Android 和 Web 平台。

##  主要功能

- **时间轴展示** - 以直观的时间轴形式展示历史事件和数据
- **时间轴对比** - 支持多条时间轴的并行对比分析
- **时间轴详情** - 查看时间轴中各项数据的详细信息
- **测验模块** - 交互式测验功能，支持用户学习和测试
- **跨平台支持** - 一套代码支持 iOS、Android 和 Web 平台

##  技术栈

- **框架**: [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- **语言**: TypeScript 5.9
- **路由**: [Expo Router](https://expo.dev/router) (文件路由)
- **React 版本**: 19.1
- **导航**: React Navigation 7.x
- **UI 组件**: Expo Vector Icons、Expo System UI
- **动画**: React Native Reanimated 4.1
- **状态管理**: React Context（History Context）
- **存储**: Async Storage

##  项目结构

```
MyRNApp/
├── app/                    # 主应用目录 (路由入口)
│   ├── (tabs)/            # Tab 导航页面组
│   ├── index.tsx          # 主页面
│   ├── quiz.tsx           # 测验页面
│   ├── timeline.tsx       # 时间轴主页面
│   ├── timeline-list.tsx  # 时间轴列表
│   ├── timeline-detail.tsx # 时间轴详情
│   ├── timeline-compare.tsx # 时间轴对比
│   ├── modal.tsx          # Modal 页面
│   └── _layout.tsx        # 根布局
├── components/            # 可复用组件
│   ├── ui/                # UI 基础组件
│   ├── themed-*.tsx       # 主题化组件
│   ├── parallax-scroll-view.tsx # 视差滚动
│   ├── history-context.tsx # 历史数据上下文
│   └── ...
├── assets/                # 静态资源
│   └── images/            # 应用图标和图片
├── constants/             # 常量定义
│   └── theme.ts           # 主题配置
├── hooks/                 # 自定义 Hooks
│   ├── use-color-scheme.ts # 颜色方案调用
│   └── use-theme-color.ts  # 主题颜色 Hook
├── scripts/               # 脚本工具
├── app.json               # Expo 配置文件
├── package.json           # 项目依赖配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 本文件
```

##  快速开始

### 前置要求

- Node.js 16+ 和 npm 8+
- Expo CLI：`npm install -g expo-cli`（可选）

### 安装和运行

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动开发服务器**

   ```bash
   npm start
   ```

3. **选择运行平台**

   在终端输出中选择以下选项之一：

   - **Android** - 打开 Android 模拟器
     ```bash
     npm run android
     ```

   - **iOS** - 打开 iOS 模拟器（需要在 macOS 上运行）
     ```bash
     npm run ios
     ```

   - **Web** - 在浏览器中打开
     ```bash
     npm run web
     ```

   - **Expo Go** - 在真机上运行（需要安装 [Expo Go](https://expo.dev/go) App）

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器 |
| `npm run android` | 在 Android 模拟器中运行 |
| `npm run ios` | 在 iOS 模拟器中运行 |
| `npm run web` | 在浏览器中运行 |
| `npm run lint` | 代码检查 |
| `npm run reset-project` | 重置项目为默认模板 |

##  故障排查

### 常见问题

1. **模块找不到错误**
   - 清理缓存：`npm install` 重新安装依赖
   - 清空 Expo 缓存：`expo start --clear`

2. **构建失败**
   - 检查 Node.js 版本：`node --version` (需 16+)
   - 更新依赖：`npm install` 或 `npm update`

3. **真机调试连接问题**
   - 确保手机和电脑在同一 WiFi 网络
   - Expo Go App 与开发服务器版本兼容

##  许可证

[添加适用的许可证信息]

##  贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2026年4月
