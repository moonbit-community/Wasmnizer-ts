struct TreeNode {
  mut hash: Option[Int]
  value: Option[Int]
  left: Option[TreeNode]
  right: Option[TreeNode]
}

fn TreeNode::new(value: Option[Int], left: Option[TreeNode], right: Option[TreeNode]) -> TreeNode {
  TreeNode::{
    hash: None,
    value,
    left,
    right,
  }
}

fn TreeNode::create(depth: Int) -> TreeNode {
  if depth > 0 {
    let d = depth - 1
    TreeNode::new(None, Some(TreeNode::create(d)), Some(TreeNode::create(d)))
  } else {
    TreeNode::new(Some(1), None, None)
  }
}

fn TreeNode::check(self: TreeNode) -> Bool {
  if self.hash.is_empty().not() {
    if self.value.is_empty().not() {
      return true
    } else if self.left.is_empty().not() && self.right.is_empty().not() {
      return self.left.unwrap().check() && self.right.unwrap().check()
    }
  }
  false
}

fn TreeNode::calHash(self: TreeNode) -> Unit {
  if self.hash.is_empty() {
    if self.value.is_empty().not() {
      self.hash = self.value
    } else if self.left.is_empty().not() && self.right.is_empty().not() {
      let left = self.left.unwrap()
      let right = self.right.unwrap()
      left.calHash()
      right.calHash()
      self.hash = Some(left.getHash() + right.getHash())
    }
  }
}

fn TreeNode::getHash(self: TreeNode) -> Int {
  match self.hash {
    Some(hash) => hash
    None => -1
  }
}

pub fn entry() -> Unit {
  let max_depth = @math.maximum(10, 0)
  let stretch_depth = max_depth + 1
  let stretch_tree = TreeNode::create(stretch_depth)
  stretch_tree.calHash()
  let long_lived_tree = TreeNode::create(max_depth)
  for depth = 4; depth <= max_depth; depth = depth + 2 {
    let iterations = (1).lsl(max_depth) - depth + 4
    let mut sum = 0
    for i = 1; i < iterations; i = i + 1 {
      let tree = TreeNode::create(depth)
      tree.calHash()
      sum += tree.getHash()
    }
  }
  long_lived_tree.calHash()
}