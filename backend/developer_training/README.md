# Developer Model Training Workspace

This workspace is the designated directory for custom model training operations, datasets, and generated weights.

## 📂 Folder Structure

- **`/datasets`**: Place your custom training images and label folders here (e.g., `train/`, `val/`).
- **`/runs`**: The directory where YOLO training sessions automatically output logs, performance plots (`results.png`), confusion matrices, and best-performing weights (`weights/best.pt`).
- **`downloaded_data.yaml`**: The downloaded dataset config file automatically generated when running the background training endpoint.

## ⚡ Quick Start

Authorized developers can trigger training on custom datasets located in this workspace by providing a secure `data.yaml` configuration to the `/api/v1/developer/train` endpoint.
