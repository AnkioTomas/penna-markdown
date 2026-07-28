设 $z \in \mathbb{R}^n$，softmax 定义为 $p_i = \dfrac{e^{z_i}}{\sum_k e^{z_k}}$。

对 $z_j$ 求偏导，分 $i = j$ 与 $i \neq j$ 两种情况：

$$
\frac{\partial p_i}{\partial z_j} = p_i(\delta_{ij} - p_j)
$$

配合交叉熵 $L = -\sum_i y_i \log p_i$，链式法则展开后中间项全部抵消：

$$
\frac{\partial L}{\partial z_j} = \sum_i \frac{\partial L}{\partial p_i}\frac{\partial p_i}{\partial z_j} = p_j - y_j
$$

::: important ⭐ 结论
梯度就是 $p - y$，一行代码的事。这也是实现里从不单独算 softmax 雅可比矩阵的原因。
:::

```python title="numerically_stable.py" {2}
def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)  # 防止 exp 溢出
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)
```

> [!CAUTION]
> 直接对原始 logits 取 `exp`，$z_i$ 稍大就会溢出成 `inf`，
> 结果变成 `nan`，训练当场发散。
