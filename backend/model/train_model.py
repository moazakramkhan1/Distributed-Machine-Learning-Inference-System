import os
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

def train_model_from_df(df, target_column="label", model_type="random_forest", model_path="model/model.pkl"):
    # Ensure model directory exists
    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    # Split features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]

    # Identify feature types
    numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object", "category"]).columns.tolist()

    # Define preprocessors
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ])

    # Combine preprocessing
    preprocessor = ColumnTransformer(transformers=[
        ("num", numeric_transformer, numeric_features),
        ("cat", categorical_transformer, categorical_features)
    ])

    # Select model type
    if model_type == "random_forest":
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    elif model_type == "logistic_regression":
        model = LogisticRegression(max_iter=1000)
    elif model_type == "svm":
        model = SVC()
    elif model_type == "decision_tree":
        model = DecisionTreeClassifier(random_state=42)
    elif model_type == "linear_regression":
        model = LinearRegression()
    else:
        raise ValueError(f"❌ Unsupported model type: {model_type}")

    # Build pipeline
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", model)
    ])

    # Train and save model
    pipeline.fit(X, y)
    joblib.dump(pipeline, model_path)
    print(f"✅ Model ({model_type}) trained and saved to {model_path}")
