import os
import mlflow
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from app.core.logging import logger

# Use MLFLOW_TRACKING_URI env var if set (CI/production), else default to local SQLite
_default_db = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mlflow.db")
)
_tracking_uri = os.environ.get("MLFLOW_TRACKING_URI", f"sqlite:///{_default_db.replace(os.sep, '/')}")
mlflow.set_tracking_uri(_tracking_uri)

logger.info(f"MLflow tracking initialized at: {mlflow.get_tracking_uri()}")

class BaseMLPipeline(ABC):
    """Abstract base class for all machine learning pipelines (Phases 56 - 67)."""

    def __init__(self, name: str):
        self.name = name
        self.experiment_id = self._get_or_create_experiment()

    def _get_or_create_experiment(self) -> str:
        """Fetch or create MLflow experiment corresponding to this pipeline."""
        try:
            exp = mlflow.get_experiment_by_name(self.name)
            if exp:
                return exp.experiment_id
            return mlflow.create_experiment(self.name)
        except Exception as e:
            logger.error(f"Failed to initialize MLflow experiment for {self.name}: {e}")
            # Fallback to default
            return "0"

    @abstractmethod
    def train(self, data: Any, **params) -> Dict[str, Any]:
        """Train the underlying ML model (TF-IDF vectorizer + SGD classifier)."""
        pass

    @abstractmethod
    def predict(self, text: str) -> Dict[str, Any]:
        """Generate prediction metrics and probability distribution logs."""
        pass

    def log_run(self, params: Dict[str, Any], metrics: Dict[str, Any], tags: Optional[Dict[str, str]] = None) -> None:
        """Log pipeline execution configurations, parameters, and results to MLflow."""
        try:
            mlflow.set_experiment(self.name)
            with mlflow.start_run(nested=True):
                # Log parameters
                for k, v in params.items():
                    mlflow.log_param(k, v)
                
                # Log metrics
                for k, v in metrics.items():
                    mlflow.log_metric(k, v)
                
                # Log tags
                if tags:
                    mlflow.set_tags(tags)
                    
                logger.info(f"Successfully logged execution run to MLflow experiment: {self.name}")
        except Exception as e:
            logger.error(f"Error logging run metrics to MLflow for {self.name}: {e}")

class ModelRegistryInterface:
    """Wrapper class mimicking models registry management services."""

    def __init__(self, pipeline_name: str):
        self.pipeline_name = pipeline_name

    def register_model_version(self, run_id: str, version: str, stage: str = "Staging") -> Dict[str, Any]:
        """Log model version mapping details inside MLflow."""
        logger.info(f"Registered model version {version} for run ID {run_id} under stage {stage}.")
        return {
            "pipeline": self.pipeline_name,
            "run_id": run_id,
            "version": version,
            "stage": stage,
            "status": "READY"
        }

    def transition_model_stage(self, version: str, new_stage: str) -> Dict[str, Any]:
        """Promote models from staging/production tiers."""
        logger.info(f"Transitioned model version {version} to stage {new_stage}.")
        return {
            "pipeline": self.pipeline_name,
            "version": version,
            "stage": new_stage,
            "status": "COMPLETED"
        }

# Global initialization metadata logging
try:
    mlflow.set_experiment("SystemInitialization")
    with mlflow.start_run():
        mlflow.log_param("system_status", "initialized")
        mlflow.log_param("mlflow_version", mlflow.__version__)
        mlflow.log_metric("initialization_code", 200)
        logger.info("MLflow SystemInitialization run logged successfully.")
except Exception as init_err:
    logger.error(f"Failed to log system initialization run to MLflow: {init_err}")
