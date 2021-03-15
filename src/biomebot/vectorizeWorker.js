import VectorizeWorker from "./worker/vectorize.worker.js";

const vectorizeWorker = typeof window === "object" && new VectorizeWorker();

export default vectorizeWorker;
