enum TreeNode {
  Empty
  Node(~left: TreeNode, ~right: TreeNode)
}

fn TreeNode::new(left: TreeNode, right: TreeNode) -> TreeNode {
  TreeNode::Node(~left, ~right)
}

fn TreeNode::create(depth: Int) -> TreeNode {
  if depth > 0 {
    let d = depth - 1
    TreeNode::new(TreeNode::create(d), TreeNode::create(d))
  } else {
    TreeNode::new(Empty, Empty)
  }
}

fn TreeNode::check_sum(node: TreeNode) -> Int {
  match node {
    Empty => 1
    Node(~left, ~right) => {
      match left {
        Empty => 1
        Node(_) => 1 + check_sum(left) + check_sum(right)
      }
    }
  }
}

pub fn entry() -> Unit {
  let max_depth = @math.maximum(10, 0)
  let stretch_depth = max_depth + 1
  let stretch_tree = TreeNode::create(stretch_depth)
  let long_lived_tree = TreeNode::create(max_depth)

  stretch_tree |> ignore
  long_lived_tree |> ignore

  for depth = 4; depth <= max_depth; depth = depth + 2 {
    let iterations = (1).lsl(max_depth) - depth + 4
    let mut sum = 0
    for i = 0; i < iterations; i = i + 1 {
      let tree = TreeNode::create(depth)
      sum += TreeNode::check_sum(tree)
    }
  }

}