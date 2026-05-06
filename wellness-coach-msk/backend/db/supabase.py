from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client
import os

load_dotenv()


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)