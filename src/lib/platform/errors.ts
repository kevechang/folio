export class ConflictError extends Error {
  constructor(message = "文件已在别处修改") {
    super(message);
    this.name = "ConflictError";
  }
}
