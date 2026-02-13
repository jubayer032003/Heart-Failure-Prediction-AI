from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import shap
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

app = FastAPI()

model = joblib.load("heart_failure_model.pkl")

# Extract pipeline components
preprocessor = model.named_steps["preprocessor"]
classifier = model.named_steps["classifier"]

# Create background data (important for SHAP stability)
background = np.zeros((1, preprocessor.transform(pd.DataFrame([{
    "Age": 50,
    "Sex": "M",
    "ChestPainType": "ATA",
    "RestingBP": 120,
    "Cholesterol": 200,
    "FastingBS": 0,
    "RestingECG": "Normal",
    "MaxHR": 150,
    "ExerciseAngina": "N",
    "Oldpeak": 1.0,
    "ST_Slope": "Up"
}])).shape[1]))

explainer = shap.LinearExplainer(classifier, background)

class PatientData(BaseModel):
    Age: int
    Sex: str
    ChestPainType: str
    RestingBP: int
    Cholesterol: int
    FastingBS: int
    RestingECG: str
    MaxHR: int
    ExerciseAngina: str
    Oldpeak: float
    ST_Slope: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Heart Failure Prediction API Running"}

@app.post("/predict")
def predict(data: PatientData):
    df = pd.DataFrame([data.dict()])
    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]

    return {
        "prediction": int(prediction),
        "probability": float(probability),
        "result": "Heart Disease Detected" if prediction == 1 else "No Heart Disease"
    }

@app.post("/explain")
def explain(data: PatientData):
    df = pd.DataFrame([data.dict()])
    processed = preprocessor.transform(df)

    shap_values = explainer(processed)

    values = shap_values.values[0]

    # Get feature names after preprocessing
    feature_names = preprocessor.get_feature_names_out()

    explanation = [
        {
            "feature": feature_names[i],
            "value": float(values[i])
        }
        for i in range(len(values))
    ]

    return {
        "shap_values": explanation,
        "base_value": float(shap_values.base_values[0])
    }
