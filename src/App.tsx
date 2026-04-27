/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Tag as TagIcon, 
  X, 
  ChevronRight,
  Hash,
  Clock,
  NotebookPen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

const STORAGE_KEY = "mymemo.notes";

// --- Initial Seed Data ---
const SEED_NOTES: Note[] = [
  {
    id: 1,
    title: "시안 작업 가이드",
    body: "디자인 시스템의 컬러 팔레트와 타이포그래피 규칙을 준수해야 합니다. 버튼의 최소 높이는 44px입니다.",
    tags: ["디자인", "가이드"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "읽어야 할 책 리스트",
    body: "1. 딥 워크 (칼 뉴포트)\n2. 클린 코드 (로버트 C. 마틴)\n3. 프로그래머의 뇌 (펠리너 헤르만스)",
    tags: ["독서", "자기개발"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "프로젝트 아이디어",
    body: "Gemini API를 활용한 로컬 메모 앱 프로젝트. 태그 기반 필터링과 오프라인 스토리지를 지원해야 함.",
    tags: ["업무", "개발"],
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  // --- States ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    body: "",
    tags: "",
  });

  // --- Initialization ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes", e);
        setNotes(SEED_NOTES);
      }
    } else {
      setNotes(SEED_NOTES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTES));
    }
  }, []);

  // --- Sync to LocalStorage ---
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  // --- Derived State ---
  const allTagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesTag = !selectedTag || note.tags.includes(selectedTag);
        const matchesSearch = !searchQuery || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTag && matchesSearch;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, selectedTag, searchQuery]);

  // --- Handlers ---
  const openNewNoteModal = () => {
    setFormData({ id: 0, title: "", body: "", tags: "" });
    setIsModalOpen(true);
  };

  const openEditNoteModal = (note: Note) => {
    setFormData({
      id: note.id,
      title: note.title,
      body: note.body,
      tags: note.tags.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = formData.tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (formData.id === 0) {
      // Create
      const newNote: Note = {
        id: Date.now(),
        title: formData.title || "제목 없음",
        body: formData.body,
        tags: tagArray,
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
    } else {
      // Update
      setNotes(notes.map(n => 
        n.id === formData.id 
          ? { ...n, title: formData.title, body: formData.body, tags: tagArray, updatedAt: new Date().toISOString() } 
          : n
      ));
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("이 메모를 삭제할까요?")) {
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* --- Header --- */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              setSelectedTag(null);
              setSearchQuery("");
            }}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
              <NotebookPen size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-950">MyMemo</h1>
          </div>

          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="제목, 내용, 태그 검색..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={openNewNoteModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">새 메모</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* --- Sidebar --- */}
        <aside className="w-full md:w-64 space-y-6">
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">태그 필터</h2>
            <nav className="space-y-1">
              <button 
                onClick={() => setSelectedTag(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedTag ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash size={16} />
                  <span>전체</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{notes.length}</span>
              </button>

              {allTagsWithCounts.map(([tag, count]) => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTag === tag ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TagIcon size={16} className={selectedTag === tag ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className="truncate">{tag}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              ))}
            </nav>
          </section>
        </aside>

        {/* --- Main Grid --- */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {selectedTag ? `#${selectedTag}` : searchQuery ? `"${searchQuery}" 검색 결과` : '모든 메모'}
              <span className="ml-2 text-sm font-normal text-slate-400">{filteredNotes.length}개</span>
            </h2>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4 }}
                    onClick={() => openEditNoteModal(note)}
                    className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                    id={`note-${note.id}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 pr-6">
                          {note.title}
                        </h3>
                        <button 
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          id={`delete-${note.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1 whitespace-pre-wrap leading-relaxed">
                        {note.body}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <Clock size={10} />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="bg-slate-100 p-6 rounded-full mb-4">
                <Search size={48} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium">검색 결과가 없습니다.</p>
              <p className="text-sm">다른 키워드를 입력해보세요.</p>
            </div>
          )}
        </main>
      </div>

      {/* --- Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {formData.id === 0 ? "새 메모 작성" : "메모 편집"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">제목</label>
                  <input
                    type="text"
                    required
                    placeholder="제목을 입력하세요"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-lg font-semibold"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">내용</label>
                  <textarea
                    rows={6}
                    placeholder="메모의 내용을 작성하세요..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">태그 (쉼표로 구분)</label>
                  <div className="relative">
                    <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="디자인, 업무, 독서..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-indigo-200 shadow-lg active:scale-95 transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
            Made with <span className="text-indigo-400 font-bold">MyMemo</span> © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
