import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book, Upload, ChevronRight, ChevronLeft, Menu, Info, Database, Globe, LogIn, LogOut, Search, X, Loader2, Type, List, PenTool, Eraser, Palette, Highlighter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, auth, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDoc, setDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BIBLE_BOOKS = [
  { id: 'gn', name: 'Gênesis', chapters: 50, test: 'vt' }, { id: 'ex', name: 'Êxodo', chapters: 40, test: 'vt' },
  { id: 'lv', name: 'Levítico', chapters: 27, test: 'vt' }, { id: 'nm', name: 'Números', chapters: 36, test: 'vt' },
  { id: 'dt', name: 'Deuteronômio', chapters: 34, test: 'vt' }, { id: 'js', name: 'Josué', chapters: 24, test: 'vt' },
  { id: 'jz', name: 'Juízes', chapters: 21, test: 'vt' }, { id: 'rt', name: 'Rute', chapters: 4, test: 'vt' },
  { id: '1sm', name: '1 Samuel', chapters: 31, test: 'vt' }, { id: '2sm', name: '2 Samuel', chapters: 24, test: 'vt' },
  { id: '1rs', name: '1 Reis', chapters: 22, test: 'vt' }, { id: '2rs', name: '2 Reis', chapters: 25, test: 'vt' },
  { id: '1cr', name: '1 Crônicas', chapters: 29, test: 'vt' }, { id: '2cr', name: '2 Crônicas', chapters: 36, test: 'vt' },
  { id: 'ed', name: 'Esdras', chapters: 10, test: 'vt' }, { id: 'ne', name: 'Neemias', chapters: 13, test: 'vt' },
  { id: 'et', name: 'Ester', chapters: 10, test: 'vt' }, { id: 'jo', name: 'Jó', chapters: 42, test: 'vt' },
  { id: 'sl', name: 'Salmos', chapters: 150, test: 'vt' }, { id: 'pv', name: 'Provérbios', chapters: 31, test: 'vt' },
  { id: 'ec', name: 'Eclesiastes', chapters: 12, test: 'vt' }, { id: 'ct', name: 'Cânticos', chapters: 8, test: 'vt' },
  { id: 'is', name: 'Isaías', chapters: 66, test: 'vt' }, { id: 'jr', name: 'Jeremias', chapters: 52, test: 'vt' },
  { id: 'lm', name: 'Lamentações', chapters: 5, test: 'vt' }, { id: 'ez', name: 'Ezequiel', chapters: 48, test: 'vt' },
  { id: 'dn', name: 'Daniel', chapters: 12, test: 'vt' }, { id: 'os', name: 'Oséias', chapters: 14, test: 'vt' },
  { id: 'jl', name: 'Joel', chapters: 3, test: 'vt' }, { id: 'am', name: 'Amós', chapters: 9, test: 'vt' },
  { id: 'ob', name: 'Obadias', chapters: 1, test: 'vt' }, { id: 'jn', name: 'Jonas', chapters: 4, test: 'vt' },
  { id: 'mq', name: 'Miquéias', chapters: 7, test: 'vt' }, { id: 'na', name: 'Naum', chapters: 3, test: 'vt' },
  { id: 'hc', name: 'Habacuque', chapters: 3, test: 'vt' }, { id: 'sf', name: 'Sofonias', chapters: 3, test: 'vt' },
  { id: 'ag', name: 'Ageu', chapters: 2, test: 'vt' }, { id: 'zc', name: 'Zacarias', chapters: 14, test: 'vt' },
  { id: 'ml', name: 'Malaquias', chapters: 4, test: 'vt' },
  { id: 'mt', name: 'Mateus', chapters: 28, test: 'nt' }, { id: 'mc', name: 'Marcos', chapters: 16, test: 'nt' },
  { id: 'lc', name: 'Lucas', chapters: 24, test: 'nt' }, { id: 'joao', name: 'João', chapters: 21, test: 'nt' },
  { id: 'at', name: 'Atos', chapters: 28, test: 'nt' }, { id: 'rm', name: 'Romanos', chapters: 16, test: 'nt' },
  { id: '1co', name: '1 Coríntios', chapters: 16, test: 'nt' }, { id: '2co', name: '2 Coríntios', chapters: 13, test: 'nt' },
  { id: 'gl', name: 'Gálatas', chapters: 6, test: 'nt' }, { id: 'ef', name: 'Efésios', chapters: 6, test: 'nt' },
  { id: 'fp', name: 'Filipenses', chapters: 4, test: 'nt' }, { id: 'cl', name: 'Colossenses', chapters: 4, test: 'nt' },
  { id: '1ts', name: '1 Tessalonicenses', chapters: 5, test: 'nt' }, { id: '2ts', name: '2 Tessalonicenses', chapters: 3, test: 'nt' },
  { id: '1tm', name: '1 Timóteo', chapters: 6, test: 'nt' }, { id: '2tm', name: '2 Timóteo', chapters: 4, test: 'nt' },
  { id: 'tt', name: 'Tito', chapters: 3, test: 'nt' }, { id: 'fm', name: 'Filemom', chapters: 1, test: 'nt' },
  { id: 'hb', name: 'Hebreus', chapters: 13, test: 'nt' }, { id: 'tg', name: 'Tiago', chapters: 5, test: 'nt' },
  { id: '1pe', name: '1 Pedro', chapters: 5, test: 'nt' }, { id: '2pe', name: '2 Pedro', chapters: 3, test: 'nt' },
  { id: '1jo', name: '1 João', chapters: 5, test: 'nt' }, { id: '2jo', name: '2 João', chapters: 1, test: 'nt' },
  { id: '3jo', name: '3 João', chapters: 1, test: 'nt' }, { id: 'jd', name: 'Judas', chapters: 1, test: 'nt' },
  { id: 'ap', name: 'Apocalipse', chapters: 22, test: 'nt' }
];

interface Verse {
  number: number;
  text: string;
}

interface OutlineNodeData {
  id: string;
  depth: number;
  text: string;
  targetChapter: number | null;
}

const parseOutlineFromRows = (rows: any[][]): OutlineNodeData[] => {
  const nodes: OutlineNodeData[] = [];
  rows.forEach((row, index) => {
    if (!row || !row.length) return;
    
    let depth = -1;
    let text = '';
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== undefined && row[i] !== null && String(row[i]).trim() !== '') {
        depth = i;
        text = String(row[i]).trim();
        break;
      }
    }
    
    if (depth === -1) return;
    
    let targetChapter = null;
    const chapterMatch = text.match(/(?:,\s*|\s)(\d+):\d+/);
    if (chapterMatch) {
      targetChapter = parseInt(chapterMatch[1], 10);
    } else {
      const singleCapMatch = text.match(/,\s*(\d+)\s*-/);
      if (singleCapMatch) targetChapter = parseInt(singleCapMatch[1], 10);
    }
    
    nodes.push({ id: `node-${index}`, depth, text, targetChapter });
  });
  return nodes;
};

const parseCsvLineRobust = (line: string) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++; 
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const parseBibleCSV = (csvText: string) => {
  const lines = csvText.split('\n');
  const data: Record<string, Record<number, Verse[]>> = {};
  let currentBookIndex = -1;
  let lastBookNumber: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCsvLineRobust(line);
    if (row.length >= 4) {
      const bookNum = row[0];
      const chapter = parseInt(row[1], 10);
      const verseNum = parseInt(row[2], 10);
      const text = row[3];

      if (bookNum !== lastBookNumber) {
        currentBookIndex++;
        lastBookNumber = bookNum;
      }

      if (currentBookIndex >= 0 && currentBookIndex < BIBLE_BOOKS.length) {
        const bookId = BIBLE_BOOKS[currentBookIndex].id;
        if (!data[bookId]) data[bookId] = {};
        if (!data[bookId][chapter]) data[bookId][chapter] = [];

        data[bookId][chapter].push({ number: verseNum, text: text });
      }
    }
  }
  return data;
};

const formatVerseText = (text: string) => {
  let processed = text
    .replace(/<J>/g, '<span class="text-red-700 font-medium">')
    .replace(/<\/J>/g, '</span>')
    .replace(/<i>/g, '<span class="italic text-slate-500">')
    .replace(/<\/i>/g, '</span>');
  return { __html: processed };
};

const getCleanText = (text: string) => {
  return text.replace(/(?:,\s*|\s)\d+:\d+.*$/, '').replace(/(?:,\s*|\s)\d+\s*-.*$/, '').trim();
};

interface Point { x: number; y: number }
interface Stroke { points: Point[]; color: string; width: number; tool: 'pen' | 'eraser' | 'highlighter' }

const DrawingCanvas = ({ storageKey, isDrawMode, drawTool, drawColor, className = "absolute inset-0 z-10" }: { storageKey: string, isDrawMode: boolean, drawTool: 'pen'|'eraser'|'highlighter', drawColor: string, className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const load = async () => {
      if (storageKey.includes('_')) { // basic check if it's not just a local key
        try {
          const docRef = doc(db, 'annotations', storageKey);
          const snap = await getDoc(docRef);
          if (snap.exists()) setStrokes(snap.data().strokes || []);
          else {
            const local = localStorage.getItem(storageKey);
            if (local) setStrokes(JSON.parse(local));
          }
        } catch (e) { 
          console.error(e); 
          const local = localStorage.getItem(storageKey);
          if (local) setStrokes(JSON.parse(local));
        }
      } else {
        const local = localStorage.getItem(storageKey);
        if (local) setStrokes(JSON.parse(local));
      }
    };
    load();
  }, [storageKey]);

  const saveStrokes = async (newStrokes: Stroke[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newStrokes)); // Always save locally as fallback
    if (storageKey.includes('_')) {
      try {
        const docRef = doc(db, 'annotations', storageKey);
        await setDoc(docRef, { strokes: newStrokes }, { merge: true });
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    ctx.clearRect(0, 0, size.w, size.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 24;
        ctx.strokeStyle = stroke.color;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.color;
      }
      ctx.stroke();
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
  }, [strokes, currentStroke, size]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawMode) return;
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    const width = drawTool === 'eraser' ? 20 : (drawTool === 'highlighter' ? 24 : 2 + pressure * 2);
    
    setCurrentStroke({ points: [{x, y}], color: drawColor, width, tool: drawTool });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawMode || !currentStroke) return;
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, {x, y}] } : null);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawMode || !currentStroke) return;
    e.stopPropagation();
    const newStrokes = [...strokes, currentStroke];
    setStrokes(newStrokes);
    setCurrentStroke(null);
    saveStrokes(newStrokes);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ pointerEvents: isDrawMode ? 'auto' : 'none', touchAction: isDrawMode ? 'none' : 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0]);
  
  const [bookContent, setBookContent] = useState<{chapter: number, verses: Verse[]}[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  
  const [currentPosition, setCurrentPosition] = useState({ chapter: 1, verse: 1 });
  const visibleVerses = useRef<Set<Element>>(new Set());
  
  const [fontSize, setFontSize] = useState<string>('text-lg');
  const [lineSpacing, setLineSpacing] = useState<string>('leading-loose');
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawTool, setDrawTool] = useState<'pen'|'eraser'|'highlighter'>('pen');
  const [drawColor, setDrawColor] = useState<string>('#4f46e5');
  
  const [outlineNodes, setOutlineNodes] = useState<OutlineNodeData[]>([]);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);

  const outlineMap = useMemo(() => {
    const map: Record<number, Record<number, OutlineNodeData[]>> = {};
    outlineNodes.forEach(node => {
      let chapter = null;
      let verse = null;
      
      const match = node.text.match(/(?:,\s*|\s)(\d+):(\d+)/);
      if (match) {
        chapter = parseInt(match[1], 10);
        verse = parseInt(match[2], 10);
      } else {
        const capMatch = node.text.match(/(?:,\s*|\s)(\d+)\s*-/);
        if (capMatch) {
          chapter = parseInt(capMatch[1], 10);
          verse = 1;
        }
      }
      
      if (chapter !== null && verse !== null) {
        if (!map[chapter]) map[chapter] = {};
        if (!map[chapter][verse]) map[chapter][verse] = [];
        map[chapter][verse].push(node);
      }
    });
    return map;
  }, [outlineNodes]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult('');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Responda a seguinte pergunta sobre a Bíblia de forma clara e concisa. Pergunta: ${searchQuery}`,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      setSearchResult(response.text || 'Não foi possível encontrar uma resposta.');
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult('Ocorreu um erro ao buscar a resposta. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if admin
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else if (currentUser.email === 'diogofukuoka85@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          console.error(e);
          setIsAdmin(currentUser.email === 'diogofukuoka85@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Verses from Firestore
  useEffect(() => {
    setLoadingVerses(true);
    const chaptersRef = collection(db, 'bible', selectedBook.id, 'chapters');
    
    const unsubscribe = onSnapshot(chaptersRef, (snapshot) => {
      if (!snapshot.empty) {
        const chapters: {chapter: number, verses: Verse[]}[] = [];
        snapshot.forEach(doc => {
          chapters.push({
            chapter: parseInt(doc.id, 10),
            verses: doc.data().verses || []
          });
        });
        chapters.sort((a, b) => a.chapter - b.chapter);
        setBookContent(chapters);
      } else {
        setBookContent([]);
      }
      setLoadingVerses(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `bible/${selectedBook.id}/chapters`);
      setBookContent([]);
      setLoadingVerses(false);
    });

    return () => unsubscribe();
  }, [selectedBook]);

  // Update current position based on scroll
  useEffect(() => {
    const pane = document.getElementById('reading-pane');
    if (!pane || bookContent.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleVerses.current.add(entry.target);
        } else {
          visibleVerses.current.delete(entry.target);
        }
      });

      let topMost: Element | null = null;
      let minTop = Infinity;
      const paneRect = pane.getBoundingClientRect();

      visibleVerses.current.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > paneRect.top + 10) {
          if (rect.top < minTop) {
            minTop = rect.top;
            topMost = el;
          }
        }
      });

      if (topMost) {
        const chapter = parseInt(topMost.getAttribute('data-chapter') || '1', 10);
        const verse = parseInt(topMost.getAttribute('data-verse') || '1', 10);
        setCurrentPosition({ chapter, verse });
      }
    }, {
      root: pane,
      rootMargin: '0px 0px 0px 0px'
    });

    const verseEls = pane.querySelectorAll('.verse-element');
    verseEls.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      visibleVerses.current.clear();
    };
  }, [bookContent]);

  // Fetch Outline from Firestore
  useEffect(() => {
    const outlineRef = doc(db, 'outlines', selectedBook.id);
    const unsubscribe = onSnapshot(outlineRef, (docSnap) => {
      if (docSnap.exists()) {
        setOutlineNodes(docSnap.data().nodes || []);
      } else {
        setOutlineNodes([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `outlines/${selectedBook.id}`);
    });
    return () => unsubscribe();
  }, [selectedBook]);

  const handleBookSelect = (book: typeof BIBLE_BOOKS[0]) => {
    setSelectedBook(book);
    setSelectedOutlineNodeId(null);
    setCurrentPosition({ chapter: 1, verse: 1 });
    
    if (window.innerWidth < 768) setSidebarOpen(false); 
    const container = document.getElementById('reading-pane');
    if (container) container.scrollTop = 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!isAdmin) {
      alert("Apenas administradores podem fazer upload de arquivos para o banco de dados.");
      return;
    }

    setUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      for (const file of files) {
        const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
        const isVerseFile = file.name.toLowerCase().includes('verse') || file.name.toLowerCase().includes('versículo') || file.name.toLowerCase().includes('versiculo');

        if (isVerseFile) {
          setUploadProgress(`Processando versículos...`);
          let text = "";
          if (isExcel) {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            text = XLSX.utils.sheet_to_csv(worksheet);
          } else {
            text = await file.text();
          }
          
          const parsedBible = parseBibleCSV(text);
          
          let batch = writeBatch(db);
          let operationCount = 0;
          let totalChapters = 0;
          
          for (const bookId of Object.keys(parsedBible)) {
            for (const chapterStr of Object.keys(parsedBible[bookId])) {
              const chapter = parseInt(chapterStr, 10);
              const verses = parsedBible[bookId][chapter];
              
              const chapterRef = doc(db, 'bible', bookId, 'chapters', chapter.toString());
              batch.set(chapterRef, { verses });
              operationCount++;
              totalChapters++;
              
              if (operationCount >= 400) {
                setUploadProgress(`Salvando no banco de dados... (${totalChapters} capítulos)`);
                await batch.commit();
                batch = writeBatch(db);
                operationCount = 0;
              }
            }
          }
          if (operationCount > 0) {
            await batch.commit();
          }
        } else {
          // Outline file
          if (isExcel) {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            for (const sheetName of workbook.SheetNames) {
              let abbrev = sheetName.toLowerCase().trim();
              if(abbrev === 'jo') abbrev = 'joao';
              if(abbrev === 'jó') abbrev = 'joao';
              
              let targetBookId = abbrev;
              let isValidBook = BIBLE_BOOKS.some(b => b.id === targetBookId);
              
              if (!isValidBook) {
                const match = file.name.match(/(?:-\s*)?([1-3]?[A-Za-zç]+)\.(?:csv|xlsx|xls)$/i);
                if (match) {
                  let fileAbbrev = match[1].toLowerCase();
                  if(fileAbbrev === 'jo') fileAbbrev = 'joao';
                  if(fileAbbrev === 'jó') fileAbbrev = 'joao';
                  if (BIBLE_BOOKS.some(b => b.id === fileAbbrev)) {
                    targetBookId = fileAbbrev;
                    isValidBook = true;
                  }
                }
              }

              if (isValidBook) {
                setUploadProgress(`Salvando esboço de ${targetBookId}...`);
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                const nodes = parseOutlineFromRows(rows);
                
                if (nodes.length > 0) {
                  const outlineRef = doc(db, 'outlines', targetBookId);
                  await setDoc(outlineRef, { nodes });
                }
              }
            }
          } else {
            // CSV Outline
            const text = await file.text();
            const lines = text.split('\n');
            const rows = lines.map(line => parseCsvLineRobust(line));
            
            const match = file.name.match(/(?:-\s*)?([1-3]?[A-Za-zç]+)\.(?:csv|xlsx|xls)$/i);
            if (match) {
              let abbrev = match[1].toLowerCase();
              if(abbrev === 'jo') abbrev = 'joao';
              if(abbrev === 'jó') abbrev = 'joao';
              
              if (BIBLE_BOOKS.some(b => b.id === abbrev)) {
                setUploadProgress(`Salvando esboço de ${abbrev}...`);
                const nodes = parseOutlineFromRows(rows);
                if (nodes.length > 0) {
                  const outlineRef = doc(db, 'outlines', abbrev);
                  await setDoc(outlineRef, { nodes });
                }
              }
            }
          }
        }
      }
      alert("Upload concluído com sucesso! Os dados agora estão no banco de dados do Google.");
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const OutlineNode = ({ node }: { node: OutlineNodeData }) => (
    <div 
      className={`flex items-start py-2 px-3 rounded-lg cursor-pointer transition-colors ${selectedOutlineNodeId === node.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-100 text-slate-700'}`}
      style={{ marginLeft: `${node.depth * 1.5}rem` }}
      onClick={() => {
        setSelectedOutlineNodeId(node.id);
        const inlineEl = document.getElementById(`inline-node-${node.id}`);
        if (inlineEl) {
          inlineEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (node.targetChapter) {
          const el = document.getElementById(`chapter-${node.targetChapter}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      <div className={`mt-1 mr-2 text-indigo-400 ${node.depth === 0 ? 'hidden' : ''}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
      </div>
      <span className="text-sm leading-snug">{node.text}</span>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Barra Lateral: Livros */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-600 text-white">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Book size={20} /> Bíblia de Estudo
          </h1>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <Menu size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-2">Antigo Testamento</div>
          {BIBLE_BOOKS.filter(b => b.test === 'vt').map(book => (
            <button
              key={book.id}
              onClick={() => handleBookSelect(book)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${selectedBook.id === book.id ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {book.name}
            </button>
          ))}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-2">Novo Testamento</div>
          {BIBLE_BOOKS.filter(b => b.test === 'nt').map(book => (
            <button
              key={book.id}
              onClick={() => handleBookSelect(book)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${selectedBook.id === book.id ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {book.name}
            </button>
          ))}
        </div>
        
        {/* Controles de Admin/Usuário */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
          {isAdmin && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full text-sm px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{uploading ? 'Enviando...' : 'Carregar DB'}</span>
            </button>
          )}
          {user ? (
            <button onClick={logOut} className="flex items-center justify-center gap-2 w-full text-sm px-3 py-2 rounded-md text-slate-600 hover:bg-slate-200 transition-colors">
              <LogOut size={16} /> <span>Sair</span>
            </button>
          ) : (
            <button onClick={signInWithGoogle} className="flex items-center justify-center gap-2 w-full text-sm px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <LogIn size={16} /> <span>Entrar</span>
            </button>
          )}
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Cabeçalho */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-500 rounded-md hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {selectedBook.name}
              {bookContent.length > 0 && !loadingVerses && (
                <span className="text-indigo-600 font-sans text-lg ml-1">
                  {currentPosition.chapter}:{currentPosition.verse}
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                className={`flex items-center justify-center p-2 rounded-full transition-colors ${isDrawMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => {
                  setIsDrawMode(!isDrawMode);
                  if (!isDrawMode && drawTool === 'eraser') setDrawTool('pen');
                }}
                title="Modo Desenho / Marca-texto"
              >
                <PenTool size={18} />
              </button>
            </div>

            <div className="relative">
              <button 
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors ${formatMenuOpen ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setFormatMenuOpen(!formatMenuOpen)}
              >
                <Type size={16} />
                <span className="hidden sm:inline">Formatar</span>
              </button>
              
              {formatMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Aparência do Texto</h3>
                  
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tamanho da Fonte</label>
                    <div className="flex gap-2">
                      <button onClick={() => setFontSize('text-base')} className={`flex-1 py-1 border rounded font-bible text-base ${fontSize === 'text-base' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>A</button>
                      <button onClick={() => setFontSize('text-lg')} className={`flex-1 py-1 border rounded font-bible text-lg ${fontSize === 'text-lg' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>A</button>
                      <button onClick={() => setFontSize('text-xl')} className={`flex-1 py-1 border rounded font-bible text-xl ${fontSize === 'text-xl' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>A</button>
                      <button onClick={() => setFontSize('text-2xl')} className={`flex-1 py-1 border rounded font-bible text-2xl ${fontSize === 'text-2xl' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>A</button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Espaçamento</label>
                    <div className="flex gap-2">
                      <button onClick={() => setLineSpacing('leading-normal')} className={`flex-1 py-1 border rounded text-sm ${lineSpacing === 'leading-normal' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>Padrão</button>
                      <button onClick={() => setLineSpacing('leading-relaxed')} className={`flex-1 py-1 border rounded text-sm ${lineSpacing === 'leading-relaxed' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>Médio</button>
                      <button onClick={() => setLineSpacing('leading-loose')} className={`flex-1 py-1 border rounded text-sm ${lineSpacing === 'leading-loose' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>Largo</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors ${searchOpen ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={16} />
              <span className="hidden sm:inline">Pesquisa IA</span>
            </button>

            <button 
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors ${outlineOpen ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setOutlineOpen(!outlineOpen)}
            >
              <Menu size={16} />
              <span className="hidden sm:inline">Esboço</span>
            </button>
          </div>
        </header>

        {/* Divisão: Painel de Esboços & Leitor Bíblico */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Painel de Pesquisa IA */}
          {searchOpen && (
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-inner z-20 absolute lg:static inset-y-0 left-0 h-full">
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Search size={16}/> Pesquisa Inteligente</h3>
                <button onClick={() => setSearchOpen(false)} className="lg:hidden text-slate-500"><X size={18}/></button>
              </div>
              <div className="p-4 flex flex-col h-full">
                <p className="text-xs text-slate-500 mb-4">Faça perguntas sobre a Bíblia. A IA usará o Google Search para trazer respostas atualizadas e precisas.</p>
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: Onde fica o Monte Sinai?" 
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" disabled={isSearching || !searchQuery.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 disabled:text-slate-400">
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  </div>
                </form>
                <div className="flex-1 overflow-y-auto custom-scroll text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {searchResult ? (
                    <div className="prose prose-sm prose-indigo" dangerouslySetInnerHTML={{__html: searchResult.replace(/\n/g, '<br/>')}} />
                  ) : (
                    <div className="text-center text-slate-400 mt-10">
                      Os resultados da sua pesquisa aparecerão aqui.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Painel de Esboços (Desktop) */}
          {outlineOpen && (
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex shrink-0 shadow-inner">
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-700">Títulos e Subtítulos</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll p-2">
                {outlineNodes.length > 0 ? (
                  outlineNodes.map((node) => <OutlineNode key={node.id} node={node} />)
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500 flex flex-col items-center gap-3 mt-10">
                    <Info size={18} />
                    <p>Nenhum esboço encontrado no banco para {selectedBook.name}.</p>
                    {isAdmin && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Upload size={18} /> Carregar Planilha
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Painel de Esboços (Mobile) */}
          {outlineOpen && (
            <div className="lg:hidden absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">Títulos e Subtítulos - {selectedBook.name}</h3>
                <button onClick={() => setOutlineOpen(false)} className="text-slate-500 p-2"><ChevronLeft size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                {outlineNodes.length > 0 ? (
                  outlineNodes.map((node) => (
                    <div key={node.id} onClick={() => setOutlineOpen(false)}>
                      <OutlineNode node={node} />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 mt-10">
                    Nenhum esboço carregado para este livro.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leitor Bíblico */}
          <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
            <div 
              className="flex-1 overflow-y-auto custom-scroll p-6 md:p-10 lg:px-20 scroll-smooth" 
              id="reading-pane"
            >
              <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-serif mb-2">{selectedBook.name}</h1>
                  <p className="text-slate-500 text-sm uppercase tracking-widest">Almeida Corrigida Fiel</p>
                </div>

                {loadingVerses ? (
                  <div className="space-y-4 animate-pulse">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>
                    ))}
                  </div>
                ) : bookContent.length > 0 ? (
                  <div className={`font-bible ${lineSpacing} ${fontSize} text-slate-800 text-justify`}>
                    {bookContent.map((chapterData) => (
                      <div key={chapterData.chapter} id={`chapter-${chapterData.chapter}`} className="mb-12 relative">
                        <DrawingCanvas 
                          storageKey={user ? `${user.uid}_${selectedBook.id}_${chapterData.chapter}` : `annotations_${selectedBook.id}_${chapterData.chapter}`}
                          isDrawMode={isDrawMode} 
                          drawTool={drawTool} 
                          drawColor={drawColor} 
                        />
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 mt-8 border-b border-slate-200 pb-2 font-sans relative z-20">Capítulo {chapterData.chapter}</h3>
                        <div className="relative z-0">
                          {chapterData.verses.map((verse) => {
                            const inlineNodes = outlineMap[chapterData.chapter]?.[verse.number] || [];
                            
                            return (
                              <React.Fragment key={verse.number}>
                                {inlineNodes.map(node => (
                                  <div 
                                    key={node.id} 
                                    id={`inline-node-${node.id}`}
                                    className={`font-sans mt-8 mb-4 ${
                                      node.depth === 0 ? 'text-2xl font-bold text-indigo-900 border-b border-indigo-100 pb-2' : 
                                      node.depth === 1 ? 'text-xl font-bold text-indigo-800' : 
                                      node.depth === 2 ? 'text-lg font-semibold text-indigo-700' : 
                                      'text-base font-medium text-indigo-600'
                                    } ${selectedOutlineNodeId === node.id ? 'bg-indigo-50 p-2 rounded-lg' : ''}`}
                                    style={{ marginLeft: node.depth > 0 ? `${node.depth * 1}rem` : '0' }}
                                  >
                                    {getCleanText(node.text)}
                                  </div>
                                ))}
                                <div 
                                  className="verse-element mb-3 group cursor-text relative"
                                  data-chapter={chapterData.chapter}
                                  data-verse={verse.number}
                                >
                                  <sup className="text-xs font-sans font-bold text-indigo-400 mr-2 select-none">{verse.number}</sup>
                                  <span 
                                    className="transition-colors duration-200 hover:bg-indigo-50 rounded px-1"
                                    dangerouslySetInnerHTML={formatVerseText(verse.text)} 
                                  />
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 mt-10">
                    Versículos não encontrados no banco de dados. Por favor, faça o upload da planilha.
                  </div>
                )}
                
                {/* Navegação de Rodapé */}
                <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center pb-8">
                  <button 
                    onClick={() => {
                      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
                      if (currentIndex > 0) handleBookSelect(BIBLE_BOOKS[currentIndex - 1]);
                    }}
                    disabled={BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id) === 0}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> <span className="hidden sm:inline">Livro Anterior</span>
                  </button>
                  
                  <div className="text-slate-400 text-sm font-medium">
                    {selectedBook.name}
                  </div>

                  <button 
                    onClick={() => {
                      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
                      if (currentIndex < BIBLE_BOOKS.length - 1) handleBookSelect(BIBLE_BOOKS[currentIndex + 1]);
                    }}
                    disabled={BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id) === BIBLE_BOOKS.length - 1}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Próximo Livro</span> <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Input Oculto para Upload de Múltiplos Arquivos */}
      <input 
        type="file" 
        multiple 
        accept=".csv, .xlsx, .xls" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload}
      />

      {/* Floating Toolbar for Drawing Mode */}
      {isDrawMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl border border-slate-200 px-4 py-2 flex items-center gap-3 z-50">
          <button onClick={() => setDrawTool('pen')} className={`p-2 rounded-full transition-colors ${drawTool === 'pen' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Caneta">
            <PenTool size={20} />
          </button>
          
          <button onClick={() => { setDrawTool('highlighter'); setDrawColor('rgba(250, 204, 21, 0.4)'); }} className={`p-2 rounded-full transition-colors ${drawTool === 'highlighter' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Marca-texto">
            <Highlighter size={20} />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          {drawTool === 'highlighter' ? (
            <>
              <button onClick={() => { setDrawTool('highlighter'); setDrawColor('rgba(250, 204, 21, 0.4)'); }} className={`w-6 h-6 rounded-full bg-yellow-300 border-2 transition-transform ${drawColor === 'rgba(250, 204, 21, 0.4)' ? 'border-yellow-500 scale-110' : 'border-transparent'}`} title="Amarelo"></button>
              <button onClick={() => { setDrawTool('highlighter'); setDrawColor('rgba(74, 222, 128, 0.4)'); }} className={`w-6 h-6 rounded-full bg-green-400 border-2 transition-transform ${drawColor === 'rgba(74, 222, 128, 0.4)' ? 'border-green-600 scale-110' : 'border-transparent'}`} title="Verde"></button>
              <button onClick={() => { setDrawTool('highlighter'); setDrawColor('rgba(244, 114, 182, 0.4)'); }} className={`w-6 h-6 rounded-full bg-pink-400 border-2 transition-transform ${drawColor === 'rgba(244, 114, 182, 0.4)' ? 'border-pink-600 scale-110' : 'border-transparent'}`} title="Rosa"></button>
            </>
          ) : (
            <>
              <button onClick={() => { setDrawTool('pen'); setDrawColor('#000000'); }} className={`w-6 h-6 rounded-full bg-black border-2 transition-transform ${drawColor === '#000000' && drawTool === 'pen' ? 'border-indigo-400 scale-110' : 'border-transparent'}`} title="Preto"></button>
              <button onClick={() => { setDrawTool('pen'); setDrawColor('#4f46e5'); }} className={`w-6 h-6 rounded-full bg-indigo-600 border-2 transition-transform ${drawColor === '#4f46e5' && drawTool === 'pen' ? 'border-indigo-400 scale-110' : 'border-transparent'}`} title="Azul"></button>
              <button onClick={() => { setDrawTool('pen'); setDrawColor('#e11d48'); }} className={`w-6 h-6 rounded-full bg-rose-600 border-2 transition-transform ${drawColor === '#e11d48' && drawTool === 'pen' ? 'border-indigo-400 scale-110' : 'border-transparent'}`} title="Vermelho"></button>
            </>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => setDrawTool('eraser')} className={`p-2 rounded-full transition-colors ${drawTool === 'eraser' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Borracha">
            <Eraser size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
