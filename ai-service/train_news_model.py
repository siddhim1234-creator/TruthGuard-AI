import os
import re
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# TRUTHGUARD AI - NEWS DETECTION MODEL
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")

DATA_FILE = os.path.join(DATA_DIR, "news.csv")
MODEL_FILE = os.path.join(MODEL_DIR, "news_model.pkl")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "news_vectorizer.pkl")


# ------------------------------------------------------------
# Create required folders
# ------------------------------------------------------------

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


# ------------------------------------------------------------
# Text cleaning
# ------------------------------------------------------------

def clean_text(text):
    """
    Basic text preprocessing for news articles.
    """

    if pd.isna(text):
        return ""

    text = str(text)

    # Convert to lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+|https\S+", " ", text)

    # Remove HTML tags
    text = re.sub(r"<.*?>", " ", text)

    # Keep letters and numbers
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


# ------------------------------------------------------------
# Load dataset
# ------------------------------------------------------------

print("=" * 60)
print("TRUTHGUARD AI - NEWS DETECTION MODEL TRAINING")
print("=" * 60)

print("\nLoading dataset...")

if not os.path.exists(DATA_FILE):
    print("\nERROR: Dataset not found!")
    print(f"\nPlease place your dataset here:")
    print(DATA_FILE)
    print("\nExpected file name:")
    print("news.csv")

    raise SystemExit(1)


df = pd.read_csv(DATA_FILE)

print(f"Dataset loaded successfully.")
print(f"Rows: {len(df)}")
print(f"Columns: {list(df.columns)}")


# ------------------------------------------------------------
# Detect text and label columns
# ------------------------------------------------------------

possible_text_columns = [
    "text",
    "article",
    "content",
    "title",
    "headline",
    "news"
]

possible_label_columns = [
    "label",
    "class",
    "target",
    "category",
    "result"
]


text_column = None
label_column = None


for column in possible_text_columns:
    if column in df.columns:
        text_column = column
        break


for column in possible_label_columns:
    if column in df.columns:
        label_column = column
        break


# ------------------------------------------------------------
# If standard columns are not found, try first two columns
# ------------------------------------------------------------

if text_column is None or label_column is None:

    print("\nStandard text/label columns were not found.")

    if len(df.columns) >= 2:
        print("Trying the first two columns automatically.")

        text_column = df.columns[0]
        label_column = df.columns[1]

    else:
        print("\nERROR: Dataset must contain at least two columns.")
        raise SystemExit(1)


print(f"\nText column  : {text_column}")
print(f"Label column : {label_column}")


# ------------------------------------------------------------
# Prepare data
# ------------------------------------------------------------

df = df[[text_column, label_column]].copy()

df[text_column] = df[text_column].fillna("").astype(str)
df[label_column] = df[label_column].astype(str).str.strip()


# Remove empty articles

df = df[df[text_column].str.strip() != ""]


# Clean text

print("\nCleaning news articles...")

df["clean_text"] = df[text_column].apply(clean_text)


# ------------------------------------------------------------
# Convert labels
# ------------------------------------------------------------

print("\nLabels found:")

print(df[label_column].value_counts())


unique_labels = df[label_column].unique()

if len(unique_labels) != 2:
    print(
        "\nERROR: The dataset must contain exactly two classes "
        "for binary Fake/Real classification."
    )

    print("Detected classes:", unique_labels)

    raise SystemExit(1)


# Try to identify Fake/Real labels

label_mapping = {}

for label in unique_labels:

    label_lower = label.lower()

    if label_lower in ["fake", "false", "0", "f"]:
        label_mapping[label] = 0

    elif label_lower in ["real", "true", "1", "r"]:
        label_mapping[label] = 1


# If labels were not recognized, automatically assign them

if len(label_mapping) != 2:

    sorted_labels = sorted(unique_labels)

    label_mapping = {
        sorted_labels[0]: 0,
        sorted_labels[1]: 1
    }

    print("\nAutomatic label mapping:")
else:
    print("\nDetected label mapping:")


print(label_mapping)


df["label_encoded"] = df[label_column].map(label_mapping)


# Remove any rows that could not be encoded

df = df.dropna(subset=["label_encoded"])

df["label_encoded"] = df["label_encoded"].astype(int)


# ------------------------------------------------------------
# Dataset summary
# ------------------------------------------------------------

print("\nDataset after preprocessing:")
print(f"Total usable articles: {len(df)}")

print("\nClass distribution:")

print(df["label_encoded"].value_counts())


# ------------------------------------------------------------
# Features and labels
# ------------------------------------------------------------

X = df["clean_text"]
y = df["label_encoded"]


# ------------------------------------------------------------
# Train/Test split
# ------------------------------------------------------------

print("\nSplitting dataset into training and testing sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print(f"Training samples: {len(X_train)}")
print(f"Testing samples : {len(X_test)}")


# ------------------------------------------------------------
# TF-IDF Vectorizer
# ------------------------------------------------------------

print("\nCreating TF-IDF features...")

vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    stop_words="english",
    sublinear_tf=True
)


X_train_tfidf = vectorizer.fit_transform(X_train)

X_test_tfidf = vectorizer.transform(X_test)


print(f"Number of TF-IDF features: {X_train_tfidf.shape[1]}")


# ------------------------------------------------------------
# Logistic Regression model
# ------------------------------------------------------------

print("\nTraining Logistic Regression model...")

model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced",
    random_state=42
)


model.fit(X_train_tfidf, y_train)


print("Model training completed.")


# ------------------------------------------------------------
# Evaluation
# ------------------------------------------------------------

print("\nEvaluating model...")

y_pred = model.predict(X_test_tfidf)


accuracy = accuracy_score(y_test, y_pred)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"\nAccuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Fake", "Real"],
        zero_division=0
    )
)


# ------------------------------------------------------------
# Save model
# ------------------------------------------------------------

print("\nSaving model...")

joblib.dump(model, MODEL_FILE)

joblib.dump(vectorizer, VECTORIZER_FILE)


print("\nModel saved successfully!")

print(f"\nModel file:")
print(MODEL_FILE)

print(f"\nVectorizer file:")
print(VECTORIZER_FILE)


# ------------------------------------------------------------
# Finished
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)

print("\nTruthGuard AI News Detection model is ready.")