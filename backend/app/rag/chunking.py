import re
from typing import List
from app.rag.schemas import VectorChunkBase

class SemanticChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_markdown(self, text: str, source_type: str, title: str, source_id: str = None, tenant_id = None) -> List[VectorChunkBase]:
        """
        Chunks markdown text focusing on heading hierarchy.
        """
        chunks = []
        # Split by headings (h1, h2, h3)
        sections = re.split(r'(^#+\s+.*$)', text, flags=re.MULTILINE)
        
        current_chunk = ""
        current_title = title
        chunk_index = 0

        for segment in sections:
            if not segment.strip():
                continue
            
            # If segment is a heading, update current title or start new chunk
            if segment.startswith('#'):
                if current_chunk:
                    chunks.append(self._create_chunk_base(current_chunk, source_type, current_title, chunk_index, source_id, tenant_id))
                    chunk_index += 1
                    current_chunk = ""
                current_title = f"{title} - {segment.lstrip('#').strip()}"
                current_chunk = segment + "\n"
            else:
                # If adding segment exceeds chunk size, split it
                if len(current_chunk) + len(segment) > self.chunk_size:
                    if current_chunk:
                        chunks.append(self._create_chunk_base(current_chunk, source_type, current_title, chunk_index, source_id, tenant_id))
                        chunk_index += 1
                        # Overlap
                        current_chunk = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else ""
                    
                    # Split segment into sub-chunks if still too large
                    sub_segments = [segment[i:i + self.chunk_size] for i in range(0, len(segment), self.chunk_size - self.chunk_overlap)]
                    for sub in sub_segments[:-1]:
                        chunks.append(self._create_chunk_base(sub, source_type, current_title, chunk_index, source_id, tenant_id))
                        chunk_index += 1
                    current_chunk = sub_segments[-1]
                else:
                    current_chunk += segment

        if current_chunk:
            chunks.append(self._create_chunk_base(current_chunk, source_type, current_title, chunk_index, source_id, tenant_id))

        return chunks

    def _create_chunk_base(self, text: str, source_type: str, title: str, index: int, source_id: str = None, tenant_id = None) -> VectorChunkBase:
        return VectorChunkBase(
            source_type=source_type,
            source_id=source_id,
            tenant_id=tenant_id,
            title=title,
            chunk_text=text.strip(),
            chunk_index=index,
            metadata={"char_count": len(text)}
        )

    def chunk_db_record(self, record_data: dict, source_type: str, title: str, source_id: str, tenant_id = None) -> List[VectorChunkBase]:
        """
        Chunks database record details into a single or multiple chunks.
        """
        # Convert dict to a readable text representation
        text_lines = [f"{k}: {v}" for k, v in record_data.items() if v is not None]
        content = "\n".join(text_lines)
        
        # For DB records, we usually want them in one chunk unless they are huge
        if len(content) > self.chunk_size:
            return self.chunk_markdown(content, source_type, title, source_id, tenant_id)
        
        return [self._create_chunk_base(content, source_type, title, 0, source_id, tenant_id)]
