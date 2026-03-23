---
title: PID和MPC
published: 2026-03-23
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---
# PID
1. 数学原理剖析 📐
假设我们要控制一个系统的输出值$$y(t)$$（比如无人机的高度），使其达到目标值 $r(t)$。那么误差就是 $e(t) = r(t) - y(t)$。
PID 的输出控制量 $$u(t)$$ 是由三部分加权相加组成的：   
$$u(t) = K_p e(t) + K_i \int_{0}^{t} e(\tau) d\tau + K_d \frac{de(t)}{dt}$$   
我们来拆解这三个项：
> 1.P (Proportional) 比例项 ⚖️：$K_p \cdot e(t)$   
      - 原理：当前的误差越大，控制力度就越大。就像弹簧一样，拉得越长，回弹力越大。   
      - 缺点：仅有 P 会产生“静差”（即永远达不到目标点，差那么一点点力）。   
    2.I (Integral) 积分项 ⏳：$K_i \cdot \int e(t) dt$   
      - 原理：它会把过去所有的误差“累加”起来。只要误差不为零，积分项就会不断增大，直到消除静差。   
      - 缺点：积分太强会导致系统反应过慢或产生大幅度震荡。   
    3.D (Derivative) 微分项 📉：$K_d \cdot \frac{de}{dt}$   
      - 原理：它测量误差变化的“速度”。如果发现误差正在快速减小，D 项会产生一个反向阻力，防止系统“冲过头”。它起到了预测和阻尼的作用。   

2. Python 项目示例：模拟恒温热水器 ♨️
为了帮你理解，我们可以用 Python 写一个简单的类。想象你在控制一个热水器，目标是将水温维持在 50°C。
```python
class PIDController:def __init__(self, Kp, Ki, Kd):
        self.Kp = Kp
        self.Ki = Ki
        self.Kd = Kd
        self.prev_error = 0
        self.integral = 0
        def update(self, setpoint, measured_value, dt):# 1. 计算误差
        error = setpoint - measured_value
        
        # 2. P 项
        P = self.Kp * error
        
        # 3. I 项 (积分累加)
        self.integral += error * dt
        I = self.Ki * self.integral
        
        # 4. D 项 (变化率)
        derivative = (error - self.prev_error) / dt
        D = self.Kd * derivative
        
        # 保存误差供下次使用
        self.prev_error = error
        
        # 输出总控制量return P + I + D
```
# MPC
💡 迈向 MPC (模型预测控制)
PID 就像是在看后视镜开车：它根据“刚才”和“现在”的偏差来修正。
而 MPC 则是看挡风玻璃开车：它拥有一个“车辆模型”，能预测未来 5 秒的轨迹并提前规划。
1. 系统模型 (The Model) 🏎️：MPC 是如何通过数学公式“预知未来”的？（比如：给定现在的油门，1秒后车在哪？）
2. 目标(代价)函数 (Cost Function) 🎯：MPC 怎么定义“什么是好”？（比如：又要快，又要省油，还要乘客坐得舒服，怎么权衡？）
3. 滚动优化 (Receding Horizon) 🔄：为什么 MPC 每一步都要重新计算一次未来的计划，而不是一次跑完？
要理解 MPC（模型预测控制），最核心的支柱就是系统模型 (The Model)。
如果说 PID 是凭借“直觉”和“经验”在开车，那么 MPC 就是在脑海里装了一个物理仿真器 🏎️。在采取任何行动之前，它都会先在模型里“演练”一遍。
什么是系统模型？
在控制理论中，模型通常是一组数学方程，它描述了系统的“状态”如何随时间变化。
最常用的表达方式是状态空间方程（State-Space Equation）：
$$x(k+1) = Ax(k) + Bu(k)$$
我们可以把这个公式拆解成通俗的语言：
- $$x(k+1)$$ (未来状态)：下一时刻系统的样子（比如：下一秒车的位置和速度）。
- $$x(k)$$ (当前状态)：现在系统的样子。
- $$u(k)$$ (控制输入)：你现在做的动作（比如：踩了多少油门，转了多少度方向盘）。
- $$A$$ 和 $B$ (系统参数)：这是模型的“灵魂”，它们代表了物理规律（比如：惯性有多大、摩擦力是多少）。

---
为什么模型能“预知未来”？
有了这个方程，MPC 就可以进行多步预测。
想象你在控制一个无人机：
1. 已知：当前的坐标和速度 $x(0)$。
2. 假设：接下来的 3 秒钟，我一直保持 50% 的推力 $u$。
3. 推算：模型会连续计算：
  - 第 1 秒：$x(1) = Ax(0) + Bu$
  - 第 2 秒：$x(2) = Ax(1) + Bu$
  - 第 3 秒：$x(3) = Ax(2) + Bu$
通过这种方式，MPC 能够看到一段预测时域 (Prediction Horizon) 内的轨迹。