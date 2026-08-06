import data from "../db/data.json";

export default function handler(req, res) {
  res.status(200).json(data);
}