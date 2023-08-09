
locals {
  lambdas = toset(
    [for file_name in fileset(path.module, "../dist/*.zip")
      : replace(basename(file_name), ".zip", "")]
  )
}