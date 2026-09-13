class BaseProvider:

    name = "Base"

    def fetch_home(self):
        raise NotImplementedError

    def get_details(self, url):
        raise NotImplementedError

    def search_mango(self, url):
        raise NotImplementedError

    def get_pages(self, chapter_url):
        raise NotImplementedError