"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Eye, ChevronUp, ChevronDown, Copy, Settings2, X, Edit, FileSpreadsheet, ExternalLink } from "lucide-react";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegistrationField {
  id: string;
  event_id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  field_placeholder?: string;
  is_required: boolean;
  field_options?: string[];
  field_order: number;
}

interface Registration {
  id: string;
  event_id: string;
  registration_data: Record<string, unknown>;
  synced_to_sheets: boolean;
  spreadsheet_id?: string;
  created_at: string;
}

interface EventRegistrationManagerProps {
  eventId: string;
  eventTitle: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto Simples", icon: "Aa", description: "Campo de texto curto" },
  { value: "email", label: "Email", icon: "@", description: "Validação de email" },
  { value: "phone", label: "Telefone", icon: "📞", description: "Campo para telefone" },
  { value: "number", label: "Número", icon: "#", description: "Apenas números" },
  { value: "date", label: "Data", icon: "📅", description: "Seletor de data" },
  { value: "textarea", label: "Texto Longo", icon: "¶", description: "Múltiplas linhas" },
  { value: "select", label: "Lista de Opções", icon: "▼", description: "Menu dropdown" },
  { value: "checkbox", label: "Caixa de Seleção", icon: "☑", description: "Sim/Não" },
];

export const EventRegistrationManager = ({ eventId, eventTitle }: EventRegistrationManagerProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRegistration, setViewingRegistration] = useState<Registration | null>(null);
  const [editingField, setEditingField] = useState<RegistrationField | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
    field_label: "",
    field_placeholder: "",
    is_required: true,
    field_options: [] as string[],
  });

  const [optionInput, setOptionInput] = useState("");
  
  // Estado para configuração rápida de 5 campos
  const [quickFields, setQuickFields] = useState([
    { field_label: "", field_type: "text", is_required: true, field_placeholder: "", field_options: [] as string[] },
    { field_label: "", field_type: "text", is_required: true, field_placeholder: "", field_options: [] as string[] },
    { field_label: "", field_type: "text", is_required: true, field_placeholder: "", field_options: [] as string[] },
    { field_label: "", field_type: "text", is_required: true, field_placeholder: "", field_options: [] as string[] },
    { field_label: "", field_type: "text", is_required: true, field_placeholder: "", field_options: [] as string[] },
  ]);
  const [showQuickSetup, setShowQuickSetup] = useState(true);
  const [quickFieldOptionInputs, setQuickFieldOptionInputs] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    fetchFields();
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchFields = async () => {
    try {
      setFields(await api<RegistrationField[]>(`/api/admin/events/${eventId}/fields`));
    } catch (error) {
      toast({
        title: "Erro ao carregar campos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const fetchRegistrations = async () => {
    try {
      setRegistrations(await api<Registration[]>(`/api/admin/events/${eventId}/registrations`));
    } catch (error) {
      toast({
        title: "Erro ao carregar inscrições",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleAddField = async () => {
    if (!newField.field_label || !newField.field_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e rótulo do campo",
        variant: "destructive",
      });
      return;
    }

    if (newField.field_type === "select" && newField.field_options.length === 0) {
      toast({
        title: "Opções obrigatórias",
        description: "Adicione pelo menos uma opção para o campo de seleção",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const fieldData = {
      field_name: newField.field_name,
      field_type: newField.field_type,
      field_label: newField.field_label,
      field_placeholder: newField.field_placeholder || null,
      is_required: newField.is_required,
      field_options: newField.field_type === "select" ? newField.field_options : null,
      field_order: editingField ? editingField.field_order : fields.length,
    };

    try {
      if (editingField) {
        await api(`/api/admin/events/${eventId}/fields/${editingField.id}`, { method: "PATCH", json: fieldData });
        toast({ title: "Campo atualizado", description: "O campo foi atualizado com sucesso" });
      } else {
        await api(`/api/admin/events/${eventId}/fields`, { method: "POST", json: fieldData });
        toast({ title: "Campo adicionado", description: "O campo foi adicionado com sucesso" });
      }
    } catch (error) {
      toast({
        title: editingField ? "Erro ao atualizar campo" : "Erro ao adicionar campo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    setDialogOpen(false);
    resetForm();
    fetchFields();
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Tem certeza que deseja excluir este campo?")) return;

    try {
      await api(`/api/admin/events/${eventId}/fields/${fieldId}`, { method: "DELETE" });
    } catch (error) {
      toast({
        title: "Erro ao excluir campo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Campo excluído",
      description: "O campo foi excluído com sucesso",
    });

    fetchFields();
  };

  const handleDuplicateField = async (field: RegistrationField) => {
    try {
      await api(`/api/admin/events/${eventId}/fields`, {
        method: "POST",
        json: {
          field_name: `${field.field_name}_copia`,
          field_type: field.field_type,
          field_label: `${field.field_label} (Cópia)`,
          field_placeholder: field.field_placeholder,
          is_required: field.is_required,
          field_options: field.field_options,
          field_order: fields.length,
        },
      });
    } catch (error) {
      toast({
        title: "Erro ao duplicar campo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Campo duplicado",
      description: "O campo foi duplicado com sucesso",
    });

    fetchFields();
  };

  const handleMoveField = async (fieldId: string, direction: "up" | "down") => {
    const fieldIndex = fields.findIndex((f) => f.id === fieldId);
    if (
      (direction === "up" && fieldIndex === 0) ||
      (direction === "down" && fieldIndex === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === "up" ? fieldIndex - 1 : fieldIndex + 1;
    [newFields[fieldIndex], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[fieldIndex],
    ];

    await api(`/api/admin/events/${eventId}/fields`, {
      method: "PUT",
      json: newFields.map((field, index) => ({ id: field.id, field_order: index })),
    });
    fetchFields();
  };

  const handleEditField = (field: RegistrationField) => {
    setEditingField(field);
    setNewField({
      field_name: field.field_name,
      field_type: field.field_type,
      field_label: field.field_label,
      field_placeholder: field.field_placeholder || "",
      is_required: field.is_required,
      field_options: field.field_options || [],
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingField(null);
    setNewField({
      field_name: "",
      field_type: "text",
      field_label: "",
      field_placeholder: "",
      is_required: true,
      field_options: [],
    });
    setOptionInput("");
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setNewField({
      ...newField,
      field_options: [...newField.field_options, optionInput.trim()],
    });
    setOptionInput("");
  };

  const removeOption = (index: number) => {
    const newOptions = newField.field_options.filter((_, i) => i !== index);
    setNewField({ ...newField, field_options: newOptions });
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleSaveQuickFields = async () => {
    // Filtrar apenas campos com label preenchido
    const fieldsToSave = quickFields
      .filter(field => field.field_label.trim() !== "")
      .map((field, index) => ({
        field_name: generateFieldName(field.field_label),
        field_type: field.field_type,
        field_label: field.field_label,
        field_placeholder: field.field_placeholder || null,
        is_required: field.is_required,
        field_options: field.field_type === "select" && field.field_options.length > 0 ? field.field_options : null,
        field_order: fields.length + index,
      }));

    if (fieldsToSave.length === 0) {
      toast({
        title: "Nenhum campo para salvar",
        description: "Preencha pelo menos um campo com um nome",
        variant: "destructive",
      });
      return;
    }

    // Validar campos do tipo select
    const invalidSelectFields = fieldsToSave.filter(
      field => field.field_type === "select" && (!field.field_options || field.field_options.length === 0)
    );

    if (invalidSelectFields.length > 0) {
      toast({
        title: "Campos incompletos",
        description: "Campos do tipo 'Lista de Opções' precisam ter pelo menos uma opção",
        variant: "destructive",
      });
      return;
    }

    try {
      await api(`/api/admin/events/${eventId}/fields`, { method: "POST", json: fieldsToSave });
    } catch (error) {
      toast({
        title: "Erro ao salvar campos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Campos salvos!",
      description: `${fieldsToSave.length} campo(s) adicionado(s) ao formulário`,
    });

    setShowQuickSetup(false);
    fetchFields();
  };

  const addQuickFieldOption = (fieldIndex: number) => {
    const optionValue = quickFieldOptionInputs[fieldIndex].trim();
    if (!optionValue) return;

    const newFields = [...quickFields];
    newFields[fieldIndex].field_options = [...newFields[fieldIndex].field_options, optionValue];
    setQuickFields(newFields);

    const newInputs = [...quickFieldOptionInputs];
    newInputs[fieldIndex] = "";
    setQuickFieldOptionInputs(newInputs);
  };

  const removeQuickFieldOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...quickFields];
    newFields[fieldIndex].field_options = newFields[fieldIndex].field_options.filter((_, i) => i !== optionIndex);
    setQuickFields(newFields);
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta inscrição?")) return;

    try {
      await api(`/api/admin/events/${eventId}/registrations/${registrationId}`, { method: "DELETE" });
    } catch (error) {
      toast({
        title: "Erro ao excluir inscrição",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Inscrição excluída",
      description: "A inscrição foi excluída com sucesso",
    });

    fetchRegistrations();
  };

  const handleViewDetails = (registration: Registration) => {
    setViewingRegistration(registration);
    setViewDialogOpen(true);
  };

  const handleSyncToSheets = async () => {
    setSyncing(true);
    
    try {
      const data = await api<{ syncedCount: number; spreadsheetId?: string }>(`/api/admin/events/${eventId}/sync`, { method: 'POST' });

      toast({
        title: "Sincronização concluída!",
        description: `${data.syncedCount} inscrições foram sincronizadas com sucesso.`,
      });

      // Recarregar as inscrições para atualizar o status
      await fetchRegistrations();

      // Se houver spreadsheetId, mostrar link
      if (data.spreadsheetId) {
        setTimeout(() => {
          toast({
            title: "Planilha criada!",
            description: "Clique para abrir a planilha no Google Sheets",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`, '_blank')}
              >
                Abrir Planilha
              </Button>
            ),
          });
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Erro ao sincronizar",
        description: (error instanceof Error && error.message) || "Verifique se as credenciais do Google Drive estão configuradas.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">
            <Settings2 className="w-4 h-4 mr-2" />
            Campos do Formulário
          </TabsTrigger>
          <TabsTrigger value="registrations">
            <Eye className="w-4 h-4 mr-2" />
            Inscrições ({registrations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {/* Configuração Rápida de 5 Campos */}
          {fields.length === 0 && showQuickSetup && (
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-lg">Configure até 5 Campos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo e nome de cada campo. Você pode configurar de 1 a 5 campos.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quickFields.map((field, index) => (
                    <div key={index} className="p-4 border-2 rounded-lg bg-background space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-primary">#{index + 1}</span>
                        <Input
                          placeholder={`Nome do campo ${index + 1} (ex: Nome Completo, Email...)`}
                          value={field.field_label}
                          onChange={(e) => {
                            const newFields = [...quickFields];
                            newFields[index].field_label = e.target.value;
                            setQuickFields(newFields);
                          }}
                          className="flex-1"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Tipo do Campo</Label>
                          <Select
                            value={field.field_type}
                            onValueChange={(value) => {
                              const newFields = [...quickFields];
                              newFields[index].field_type = value;
                              // Limpar opções se mudar de select para outro tipo
                              if (value !== "select") {
                                newFields[index].field_options = [];
                              }
                              setQuickFields(newFields);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue>
                                {(() => {
                                  const selectedType = FIELD_TYPES.find(t => t.value === field.field_type);
                                  return selectedType ? (
                                    <span className="flex items-center gap-2">
                                      <span>{selectedType.icon}</span>
                                      <span>{selectedType.label}</span>
                                    </span>
                                  ) : "Selecione...";
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {FIELD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <span className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Obrigatório</Label>
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={(checked) => {
                              const newFields = [...quickFields];
                              newFields[index].is_required = checked;
                              setQuickFields(newFields);
                            }}
                          />
                        </div>
                      </div>

                      {/* Campos específicos por tipo */}
                      {(field.field_type === "text" || field.field_type === "email" || 
                        field.field_type === "phone" || field.field_type === "number" || 
                        field.field_type === "textarea") && (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            Placeholder (opcional)
                          </Label>
                          <Input
                            placeholder="Texto de exemplo..."
                            value={field.field_placeholder}
                            onChange={(e) => {
                              const newFields = [...quickFields];
                              newFields[index].field_placeholder = e.target.value;
                              setQuickFields(newFields);
                            }}
                          />
                        </div>
                      )}

                      {field.field_type === "select" && (
                        <div className="border-2 border-primary/20 rounded-lg p-3 bg-primary/5">
                          <Label className="text-sm font-semibold mb-2 block">
                            Opções da Lista
                          </Label>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Digite uma opção"
                                value={quickFieldOptionInputs[index]}
                                onChange={(e) => {
                                  const newInputs = [...quickFieldOptionInputs];
                                  newInputs[index] = e.target.value;
                                  setQuickFieldOptionInputs(newInputs);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addQuickFieldOption(index);
                                  }
                                }}
                              />
                              <Button 
                                type="button" 
                                size="sm"
                                onClick={() => addQuickFieldOption(index)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {field.field_options.length > 0 && (
                              <div className="space-y-1">
                                {field.field_options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="flex items-center justify-between p-2 bg-background rounded border"
                                  >
                                    <span className="text-sm">{option}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeQuickFieldOption(index, optionIndex)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleSaveQuickFields} className="flex-1">
                    Salvar Campos
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuickSetup(false)}
                  >
                    Configurar Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Configurar Formulário</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fields.length} campo(s) configurado(s)
                  </p>
                </div>
                <Dialog
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Campo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingField ? "Editar Campo" : "Adicionar Novo Campo"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          1. Escolha o Tipo de Campo
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {FIELD_TYPES.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("Tipo selecionado:", type.value);
                                setNewField({ ...newField, field_type: type.value });
                              }}
                              className={`p-4 rounded-lg border-2 transition-all hover:border-primary hover:shadow-md cursor-pointer ${
                                newField.field_type === type.value
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-border bg-background"
                              }`}
                            >
                              <div className="text-2xl mb-2">{type.icon}</div>
                              <div className="text-sm font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {type.description}
                              </div>
                              {newField.field_type === type.value && (
                                <div className="mt-2 text-primary text-xs font-semibold">
                                  ✓ Selecionado
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {newField.field_type && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm text-primary font-medium">
                              ✓ Tipo selecionado:{" "}
                              {FIELD_TYPES.find((t) => t.value === newField.field_type)?.label}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="field_label">2. Rótulo do Campo *</Label>
                          <Input
                            id="field_label"
                            placeholder="Ex: Nome Completo"
                            value={newField.field_label}
                            onChange={(e) => {
                              const label = e.target.value;
                              setNewField({
                                ...newField,
                                field_label: label,
                                field_name: newField.field_name || generateFieldName(label),
                              });
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Este é o texto que aparecerá no formulário
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="field_name">3. Nome da Variável *</Label>
                          <Input
                            id="field_name"
                            placeholder="Ex: nome_completo"
                            value={newField.field_name}
                            onChange={(e) =>
                              setNewField({ ...newField, field_name: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use apenas letras minúsculas, números e underline (gerado automaticamente)
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="field_placeholder">4. Placeholder (opcional)</Label>
                        <Input
                          id="field_placeholder"
                          placeholder="Ex: Digite seu nome completo"
                          value={newField.field_placeholder}
                          onChange={(e) =>
                            setNewField({ ...newField, field_placeholder: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Texto de exemplo que aparece dentro do campo vazio
                        </p>
                      </div>

                      {newField.field_type === "select" && (
                        <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                          <Label className="text-base font-semibold">5. Opções do Menu *</Label>
                          <p className="text-sm text-muted-foreground mb-3">
                            Adicione as opções que aparecerão no menu dropdown
                          </p>
                          <div className="space-y-2 mt-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Digite uma opção"
                                value={optionInput}
                                onChange={(e) => setOptionInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addOption();
                                  }
                                }}
                              />
                              <Button type="button" onClick={addOption}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {newField.field_options.length > 0 && (
                              <div className="space-y-1">
                                {newField.field_options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-muted rounded"
                                  >
                                    <span>{option}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOption(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="is_required" className="cursor-pointer text-base font-semibold">
                            {newField.field_type === "select" ? "6." : "5."} Campo Obrigatório
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            O usuário será obrigado a preencher este campo
                          </p>
                        </div>
                        <Switch
                          id="is_required"
                          checked={newField.is_required}
                          onCheckedChange={(checked) =>
                            setNewField({ ...newField, is_required: checked })
                          }
                        />
                      </div>

                      <Button onClick={handleAddField} disabled={loading} className="w-full">
                        {loading
                          ? "Salvando..."
                          : editingField
                          ? "Salvar Alterações"
                          : "Adicionar Campo"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum campo configurado</p>
                  <p className="text-sm">Adicione campos para criar o formulário de inscrição</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <GripVertical className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold text-base">{field.field_label}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {
                                    FIELD_TYPES.find((t) => t.value === field.field_type)?.label
                                  }
                                </Badge>
                                {field.is_required && (
                                  <Badge variant="outline" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Variável: <code className="bg-muted px-1 rounded">{field.field_name}</code>
                              </p>
                              {field.field_placeholder && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Placeholder: {field.field_placeholder}
                                </p>
                              )}
                              {field.field_options && field.field_options.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Opções: {field.field_options.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveField(field.id, "up")}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveField(field.id, "down")}
                              disabled={index === fields.length - 1}
                              title="Mover para baixo"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicateField(field)}
                              title="Duplicar campo"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField(field)}
                              title="Editar campo"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteField(field.id)}
                              title="Excluir campo"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Inscrições Recebidas</span>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {registrations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma inscrição recebida</p>
                  <p className="text-sm">As inscrições aparecerão aqui quando forem enviadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-sm font-medium">Total de Inscrições</p>
                        <p className="text-2xl font-bold">{registrations.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Sincronizadas</p>
                        <p className="text-2xl font-bold">
                          {registrations.filter((r) => r.synced_to_sheets).length}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSyncToSheets}
                      disabled={syncing || registrations.filter(r => !r.synced_to_sheets).length === 0}
                      className="gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      {syncing ? "Sincronizando..." : "Sincronizar com Google Sheets"}
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {registrations.map((registration) => (
                      <Card key={registration.id}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <p className="text-xs text-muted-foreground">
                                {new Date(registration.created_at).toLocaleString("pt-BR")}
                              </p>
                              <div className="flex items-center gap-2">
                                {registration.synced_to_sheets && registration.spreadsheet_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${registration.spreadsheet_id}`, '_blank')}
                                    title="Abrir planilha no Google Sheets"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                {registration.synced_to_sheets && (
                                  <Badge variant="outline" className="text-xs bg-green-50">
                                    ✓ Sincronizado
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(registration)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRegistration(registration.id)}
                                  title="Excluir inscrição"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(registration.registration_data)
                                .slice(0, 4)
                                .map(([key, value]) => (
                                  <div key={key} className="border-l-2 border-primary pl-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                      {key.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-sm font-medium">{String(value)}</p>
                                  </div>
                                ))}
                            </div>
                            {Object.keys(registration.registration_data).length > 4 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{Object.keys(registration.registration_data).length - 4} campos adicionais
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização de Detalhes */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Inscrição</DialogTitle>
          </DialogHeader>
          {viewingRegistration && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Data da Inscrição</p>
                    <p className="text-sm font-semibold">
                      {new Date(viewingRegistration.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    {viewingRegistration.synced_to_sheets ? (
                      <Badge variant="outline" className="bg-green-50">
                        ✓ Sincronizado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Informações do Inscrito</h3>
                <div className="space-y-3">
                  {Object.entries(viewingRegistration.registration_data).map(([key, value]) => (
                    <div key={key} className="p-3 border-l-4 border-primary bg-muted/30 rounded-r">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-medium break-words">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleDeleteRegistration(viewingRegistration.id);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Inscrição
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};