import logging
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Any
from transformers import LlamaTokenizer, LlamaForCausalLM, GenerationConfig
# from transformers import LLaMATokenizer, LLaMAForCausalLM, GenerationConfig
from peft import PeftModel

# Configure logging
logging.basicConfig(filename="app.log", level=logging.INFO)

app = FastAPI()

tokenizer = None
model = None

# Define the item model for requests
class Item(BaseModel):
    text: str

# Function to load models when the application starts
@app.on_event("startup")
def load_model():
    global tokenizer, model

    tokenizer = LlamaTokenizer.from_pretrained("decapoda-research/llama-7b-hf")

    model = LlamaForCausalLM.from_pretrained(
        "decapoda-research/llama-7b-hf",
        load_in_8bit=True,
        device_map="auto",
    )
    model = PeftModel.from_pretrained(model, "samwit/alpaca7B-lora")
    logging.info("Model loaded.")

# Function to generate a response from Alpaca
def prompt_alpaca(text):
    global tokenizer, model

    inputs = tokenizer(text, return_tensors="pt")
    input_ids = inputs["input_ids"].cuda()

    # Config for the generation
    generation_config = GenerationConfig(
        temperature=0.6,
        top_p=0.95,
        repetition_penalty=1.2,
    )

    logging.info("Alpaca generating...")
    generation_output = model.generate(
        input_ids=input_ids,
        generation_config=generation_config,
        return_dict_in_generate=True,
        output_scores=True,
        max_new_tokens=256,
    )

    # Append the decoded sequence to the final string
    final = ''.join(tokenizer.decode(s) + "\n" for s in generation_output.sequences)
    return final.strip()

# Function to classify a post
def classify_post(post_content):

    # Prepare input for the model
    sentiment_resp = f'''Below is text content from a forum post. Write an analysis that appropriately describes if it should be allowed on a forum platform.

    ### Text content:
    {post_content}

    ### Analysis:
    '''

    sentiment_resp = prompt_alpaca(sentiment_resp)
    sentiment_resp_formatted = sentiment_resp[sentiment_resp.index("Analysis:\n") + 10:]
    logging.info(f'sentiment_resp_formatted: {sentiment_resp_formatted}')

    # Prepare input for the model
    classification_resp = f'''Below is text describing a forum post. Summarize the description into either 'allowed' or 'disallowed'.

    
    ### Text:
    {sentiment_resp_formatted}

    ### Summary:
    '''

    final = prompt_alpaca(classification_resp)
    final_f = final[final.index("Summary:\n") + 10:].split()[0]

    return final_f

# Endpoint to classify text
@app.post("/classify")
async def classify_text(item: Item):
    response = classify_post(item.text)
    return {"classification": response}

print("done!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost:8100", port=8100)