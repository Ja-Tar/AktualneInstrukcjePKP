import re
import json
from json import JSONEncoder
from datetime import datetime, date
import requests
from bs4 import BeautifulSoup
from bs4.element import Tag

def _default(self, obj):
    return getattr(obj.__class__, "to_json", _default.default)(obj) # type: ignore

_default.default = JSONEncoder().default # type: ignore
JSONEncoder.default = _default # type: ignore

def get_HTML(_url):
    response = requests.get(_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    response.encoding = "utf-8"
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")

def get_uploads(soup: BeautifulSoup):
    uploads = soup.find_all("div", class_="frame-type-uploads")
    for upload in uploads:
        upload.extract()
    return uploads

def get_number_header(upload: Tag) -> str | None:
    header = upload.find("h3")
    if isinstance(header, Tag):
        return header.get_text(strip=True).split(" - ")[0]
    return None

def get_file_versions(upload: Tag) -> list[Tag]:
    files = upload.find_all("div", class_="file-list__item")
    processed_files: list[Tag] = []
    for file in files:
        if not isinstance(file, Tag):
            continue
        link = file.find("a", class_="file-list__item__link")
        if link and isinstance(link, Tag):
            processed_files.append(link)
    return processed_files

class FileVersion:
    def __init__(self, name: str, number: str, resource_url: str | None, wcag: bool, from_date: date | None, to_date: date | None):
        self.name = name
        self.number = number
        self.resource_url = resource_url
        self.wcag = wcag
        self.from_date = from_date
        self.to_date = to_date

    def __repr__(self):
        return f"FileVersion(name={self.name}, number={self.number}, wcag={self.wcag}, from_date={self.from_date}, to_date={self.to_date})"

    def to_json(self) -> dict:
        return {
            "name": self.name,
            "number": self.number,
            "resource_url": self.resource_url,
            "wcag": self.wcag,
            "from_date": self.from_date.isoformat() if self.from_date else None,
            "to_date": self.to_date.isoformat() if self.to_date else None
        }

class File:
    def __init__(self, number: str, versions: list[FileVersion]):
        self.number = number
        self.versions = versions

    def to_json(self) -> dict:
        return {
            "number": self.number,
            "versions": [version.to_json() for version in self.versions]
        }

def process_file_versions(versions: list[Tag]) -> list[FileVersion]:
    # <a
    # href="/files/public/user_upload/pdf/Akty_prawne_i_przepisy/Instrukcje/Wydruk/Ie/05_Instrukcja_Ie-1-od_2025-05-20_WCAG.pdf"
    # class="file-list__item__link" target="_blank"
    # > 
    # Instrukcja sygnalizacji <strong>Ie-1 - wersja dostosowana do zasad WCAG -</strong> obowiązuje od 20.05.2025 r. 
    # </a>

    file_versions = []

    for version in versions:
        # 1: Instrukcja sygnalizacji
        # 2: <strong>Ie-1 - wersja dostosowana do zasad WCAG -</strong> / <strong>Ie-1</strong>
        # 3: obowiązuje od 20.05.2025 r.

        file_name = ""
        file_number = ""
        file_resource_url = str(version.get("href", ""))
        file_wcag = False
        from_date = None
        to_date = None

        for content in version.contents:
            index = version.contents.index(content)
            if isinstance(content, str):
                if index == 0:
                    file_name = content.strip()
                    continue

                from_date_match = re.search(r"od (\d{2}\.\d{2}\.\d{4})", content)
                if from_date_match:
                    from_date = datetime.strptime(from_date_match.group(1), "%d.%m.%Y").date()

                to_date_match = re.search(r"do (\d{2}\.\d{2}\.\d{4})", content)
                if to_date_match:
                    to_date = datetime.strptime(to_date_match.group(1), "%d.%m.%Y").date()

            if isinstance(content, Tag):
                content_text = content.get_text(strip=True)

                file_number_match = re.search(r"(I[r|e]-\w*)($|\s)", content_text, re.MULTILINE)
                if file_number_match:
                    file_number = file_number_match.group(1)

                file_wcag_match = re.search(r"WCAG", content_text)
                if file_wcag_match:
                    file_wcag = True

        file_versions.append(FileVersion(file_name, file_number, file_resource_url, file_wcag, from_date, to_date))

    return file_versions

def merge_duplicate_file_versions(files: list[File]) -> list[File]:
    '''Check for two deferent files but the same number_header and combine them'''
    file_groups: dict[str, list[File]] = {}
    for file in files:
        if file.number in file_groups:
            file_groups[file.number].append(file)
        else:
            file_groups[file.number] = [file]

    for files_group in file_groups.values():
        if len(files_group) > 1:
            # Combine the file versions
            combined_versions = []
            for f in files_group:
                #print("Więcej niż jedna wersja:", f.number, f.versions)
                combined_versions.extend(f.versions)
            # Create a new File object with the combined versions
            combined_file = File(files_group[0].number, combined_versions)
            files_group.append(combined_file)

    unique_files = []
    for files_group in file_groups.values():
        unique_files.append(files_group[-1])
    return unique_files

def process_HTML(soup: BeautifulSoup):
    uploads = get_uploads(soup)
    files: list[File] = []

    for upload in uploads:
        if not isinstance(upload, Tag):
            continue

        number_header = get_number_header(upload)
        if not number_header:
            continue

        file_versions = process_file_versions(get_file_versions(upload))

        files.append(File(number_header, file_versions))

    return merge_duplicate_file_versions(files)

def get_current_files(_files: list[File]) -> list[FileVersion]:
    '''Get the current file versions based on their dates'''
    _current_files_dict: dict[str, list[FileVersion]] = {}
    for file in _files:
        if file.versions:
            for version in file.versions:
                today = datetime.now().date()
                if (
                    (version.to_date is None or version.to_date >= today)
                    and (version.from_date is None or version.from_date <= today)
                ):
                    _current_files_dict.setdefault(file.number, []).append(version)

    # get the newest from each group (check for wcag and add one wcag and one none wcag)
    _current_files = []
    for versions in _current_files_dict.values():
        wcag_versions = [v for v in versions if v.wcag]
        none_wcag_versions = [v for v in versions if not v.wcag]
        if wcag_versions:
            _current_files.append(max(wcag_versions, key=lambda v: v.from_date or date.min))
        if none_wcag_versions:
            _current_files.append(max(none_wcag_versions, key=lambda v: v.from_date or date.min))
    return _current_files

if __name__ == "__main__":
    pages = {
        "ruch-i-przewozy-kolejowe": "https://www.plk-sa.pl/klienci-i-kontrahenci/akty-prawne-i-przepisy/instrukcje-pkp-polskich-linii-kolejowych-sa/ruch-i-przewozy-kolejowe",
        "automatyka-i-telekomunikacja": "https://www.plk-sa.pl/klienci-i-kontrahenci/akty-prawne-i-przepisy/instrukcje-pkp-polskich-linii-kolejowych-sa/automatyka-i-telekomunikacja"
    }

    all_folder = "./allFiles"
    current_folder = "./currentFiles"

    for page, url in pages.items():
        html_document = get_HTML(url)
        files = process_HTML(html_document)

        # make json file
        with open(f"{all_folder}/{page}.json", "w", encoding="utf-8") as json_file:
            json.dump(files, json_file, ensure_ascii=False, indent=4)

        current_files = get_current_files(files)
        with open(f"{current_folder}/{page}.json", "w", encoding="utf-8") as json_file:
            json.dump(current_files, json_file, ensure_ascii=False, indent=4)
