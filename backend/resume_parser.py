import io
import PyPDF2

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF file using PyPDF2.
    """
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
