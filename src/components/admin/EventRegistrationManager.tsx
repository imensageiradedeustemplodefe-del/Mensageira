"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Eye, ChevronUp, ChevronDown, Copy, Settings2, X, Edit } from "lucide-react";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { RegistrationsList } from "./RegistrationsList";
import { RatingInput, RatingStylePicker, ratingStyleOf } from "@/components/forms/RatingInput";
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
  maxParticipants?: number | null;
  contributionCents?: number | null;
  /** aba aberta inicialmente: formulário (campos) ou lista de inscritos */
  defaultTab?: "fields" | "registrations";
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
  { value: "rating", label: "Escala 0 a 5", icon: "⭐", description: "Ícones de 0 a 5 (ex.: expectativa)" },
];

export const EventRegistrationManager = ({ eventId, eventTitle, maxParticipants, contributionCents, defaultTab = "fields" }: EventRegistrationManagerProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<RegistrationField | null>(null);
  const [loading, setLoading] = useState(false);
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
  const [ratingPreview, setRatingPreview] = useState<string | undefined>(undefined);
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
      field_options:
        newField.field_type === "select"
          ? newField.field_options
          : newField.field_type === "rating"
            ? [ratingStyleOf(newField.field_options)]
            : null,
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
        field_options:
          field.field_type === "select" && field.field_options.length > 0
            ? field.field_options
            : field.field_type === "rating"
              ? [ratingStyleOf(field.field_options)]
              : null,
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} className="w-full">
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

                      {field.field_type === "rating" && (
                        <div className="border-2 border-primary/20 rounded-lg p-3 bg-primary/5 space-y-2">
                          <Label className="text-sm font-semibold block">Estilo dos ícones</Label>
                          <RatingStylePicker
                            value={ratingStyleOf(field.field_options)}
                            onChange={(st) => {
                              const newFields = [...quickFields];
                              newFields[index].field_options = [st];
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
                        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de campo">
                          {FIELD_TYPES.map((type) => {
                            const selected = newField.field_type === type.value;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setNewField({ ...newField, field_type: type.value });
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                                  selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50 hover:bg-muted/40"
                                }`}
                              >
                                <span
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-semibold ${
                                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                  }`}
                                  aria-hidden
                                >
                                  {type.icon}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium leading-tight">{type.label}</span>
                                  <span className="block text-xs text-muted-foreground leading-snug">{type.description}</span>
                                </span>
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                                  }`}
                                  aria-hidden
                                >
                                  {selected ? "✓" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
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

                      {newField.field_type === "rating" && (
                        <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3">
                          <Label className="text-base font-semibold">5. Estilo dos ícones</Label>
                          <RatingStylePicker
                            value={ratingStyleOf(newField.field_options)}
                            onChange={(st) => setNewField({ ...newField, field_options: [st] })}
                          />
                          <div className="rounded-lg border bg-background p-3">
                            <p className="text-xs text-muted-foreground mb-2">Prévia (como a pessoa vai ver):</p>
                            <p className="text-sm font-medium mb-2">{newField.field_label || "Sua pergunta aqui"}</p>
                            <RatingInput style={ratingStyleOf(newField.field_options)} value={ratingPreview} onChange={setRatingPreview} />
                          </div>
                        </div>
                      )}

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
                            {newField.field_type === "select" || newField.field_type === "rating" ? "6." : "5."} Campo Obrigatório
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
          <RegistrationsList eventId={eventId} eventTitle={eventTitle} maxParticipants={maxParticipants} contributionCents={contributionCents} onChange={fetchRegistrations} />
        </TabsContent>
      </Tabs>

    </div>
  );
};