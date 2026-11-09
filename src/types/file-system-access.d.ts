interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry: (other: FileSystemHandle) => Promise<boolean>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
  removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
}

interface FileSystemDirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
}

interface Window {
  showDirectoryPicker?: (options?: FileSystemDirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker?: () => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: () => Promise<FileSystemFileHandle>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: FileSystemDirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  }
}

export {};
