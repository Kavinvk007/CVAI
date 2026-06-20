import chromadb
import uuid

# Initialize ChromaDB client
client = chromadb.Client()

def add_resume_to_rag(resume_id: int, resume_text: str):
    """
    Splits resume text into chunks and adds them to ChromaDB.
    """
    # We create or get a collection for each resume to keep context separate
    collection_name = f"resume_{resume_id}"
    try:
        collection = client.create_collection(name=collection_name)
    except Exception:
        collection = client.get_collection(name=collection_name)
        
    # Split text into simple chunks (in production, use a better splitter like LangChain's RecursiveCharacterTextSplitter)
    chunk_size = 500
    chunks = [resume_text[i:i+chunk_size] for i in range(0, len(resume_text), chunk_size)]
    
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [{"resume_id": resume_id} for _ in chunks]
    
    collection.add(
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )

def ask_resume_question(resume_id: int, question: str) -> str:
    """
    Queries ChromaDB for relevant resume chunks and uses Gemini to answer the question.
    """
    collection_name = f"resume_{resume_id}"
    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        return "Resume context not found in the database. Please upload again."

    results = collection.query(
        query_texts=[question],
        n_results=3
    )

    context = " ".join(results['documents'][0])

    from ai_service import model

    if not model:
        return "AI model not configured. Cannot answer questions."

    prompt = f"""
    You are an AI assistant helping a user understand a resume.
    Based on the following context from the resume, answer the user's question.
    If the context does not contain the answer, say "I cannot find the answer in the resume."

    Context:
    {context}

    Question:
    {question}

    Answer:
    """

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating answer: {str(e)}"
