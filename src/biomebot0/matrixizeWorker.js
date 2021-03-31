import MatrixizeWorker from "./worker/matrixize.worker.js";

const matrixizeWorker = typeof window === "object" && new MatrixizeWorker();

export default matrixizeWorker;
