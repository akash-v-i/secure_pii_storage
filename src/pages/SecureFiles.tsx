import React, { useState, useCallback, useEffect } from 'react';
import { vaultAPI } from '@/lib/api';
import { FileText, Upload, Download, Trash2, Lock, File, Image, FileType } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SecureFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  encrypted: boolean;
}


const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileType;
  return File;
};

export const SecureFiles: React.FC = () => {
  const [files, setFiles] = useState<SecureFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await vaultAPI.listFiles();
      // Format the data to match SecureFile interface
      const formattedFiles = data.map((f: any) => ({
        id: String(f.id),
        name: f.name,
        type: f.type,
        size: formatFileSize(f.size),
        uploadedAt: new Date(f.uploadedAt).toISOString().split('T')[0],
        encrypted: true
      }));
      setFiles(formattedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    processFiles(selectedFiles);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    const toastId = toast.loading(`Encrypting and uploading ${fileList.length} file(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of fileList) {
      try {
        await vaultAPI.uploadFile(file);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully encrypted and uploaded ${successCount} file(s)`, {
        id: toastId,
      });
      loadFiles(); // Reload list
    }

    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} file(s)`, {
        id: successCount === 0 ? toastId : undefined,
      });
    }

    if (successCount === 0 && failCount === 0) {
      toast.dismiss(toastId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async (id: string) => {
    try {
      await vaultAPI.deleteFile(id);
      setFiles(files.filter(f => f.id !== id));
      toast.success('File deleted', {
        description: 'The encrypted file has been permanently removed.',
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (file: SecureFile) => {
    const toastId = toast.loading(`Decrypting and downloading ${file.name}...`);
    try {
      await vaultAPI.downloadFile(file.id, file.name);
      toast.success('Download started', { id: toastId });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed', { id: toastId });
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Encrypted File Storage"
        description="Securely store and manage sensitive documents"
        icon={FileText}
      />

      {/* Upload Zone */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
              isDragging
                ? "border-secure bg-secure/5"
                : "border-border hover:border-muted-foreground/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-secure/20" : "bg-muted"
            )}>
              <Upload className={cn(
                "w-8 h-8",
                isDragging ? "text-secure" : "text-muted-foreground"
              )} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Drop files here to encrypt and upload
            </h3>
            <p className="text-muted-foreground mb-4">
              Supported formats: PDF, JPG, PNG (Max 10MB)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.pdf"
            />
            <Button variant="outline" className="gap-2" onClick={handleBrowseClick}>
              <Upload className="w-4 h-4" />
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="bg-secure-muted border border-secure/20 rounded-lg p-4 mb-6 flex items-center gap-3">
        <Lock className="w-5 h-5 text-secure flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-medium">Client-Side Encryption:</span> Files are encrypted in your browser before upload.
          Only you possess the decryption key.
        </p>
      </div>

      {/* Files Table */}
      <Card>
        <div className="overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">File Name</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Size</TableHead>
                <TableHead className="font-semibold">Uploaded</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <TableRow key={file.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.type.split('/')[1].toUpperCase()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.size}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.uploadedAt}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-secure text-secure bg-secure/5 gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Encrypted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {files.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No encrypted files yet</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SecureFiles;
