import { useState, useMemo, FormEvent, useEffect } from 'react';
import { Customer, PlanType } from '../types';
import { generateUniqueIndianName } from '../utils/churnLogic';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import { 
  Search, 
  User, 
  PhoneCall, 
  Trash2, 
  AlertCircle, 
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Check,
  X,
  FolderPlus,
  UploadCloud,
  FileCode,
  Download,
  Database,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileJson,
  LogIn
} from 'lucide-react';

interface PageDetailsProps {
  customers: Customer[];
  onDeleteCustomer: (id: string) => void;
  onSaveCustomer: (customer: Customer) => void;
  onConnectCloudDatabase?: () => void;
  user?: any;
}

export default function PageDetails({ 
  customers, 
  onDeleteCustomer,
  onSaveCustomer,
  onConnectCloudDatabase,
  user
}: PageDetailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'tenure' | 'risk'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Input state for adding an individual subscriber manually right inside the Detail Registry to assure dynamic live updates
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('Standard');
  const [newTenure, setNewTenure] = useState(12);
  const [newUsage, setNewUsage] = useState(45);
  const [newSpend, setNewSpend] = useState(60);
  const [newSupport, setNewSupport] = useState(2);
  const [formError, setFormError] = useState<string | null>(null);

  // --- SUPABASE STORAGE & FILE PERSISTENCE STATES ---
  const [bucketName, setBucketName] = useState('telecom-details');
  const [bucketFiles, setBucketFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ type: 'info' | 'success' | 'error'; msg: string } | null>(null);

  // Editable JSON buffer for manually authoring details directly in UI files
  const [manualJsonInput, setManualJsonInput] = useState<string>(
    JSON.stringify([
      {
        "id": "man-upload-001",
        "name": "David Wallace",
        "tenure": 14,
        "monthlyUsage": 58.6,
        "rechargeAmount": 65,
        "planType": "Standard",
        "contractType": "One year",
        "supportCalls": 1,
        "churnProbability": 12,
        "willChurn": false,
        "riskFactors": ["Consistent billing balance"]
      },
      {
        "id": "man-upload-002",
        "name": "Robert California",
        "tenure": 3,
        "monthlyUsage": 115.4,
        "rechargeAmount": 110,
        "planType": "Premium",
        "contractType": "Month-to-month",
        "supportCalls": 4,
        "churnProbability": 84,
        "willChurn": true,
        "riskFactors": ["High Premium Cost Weight", "Rapid support escalation"]
      }
    ], null, 2)
  );

  // Fetch online files inside the specified bucket
  async function fetchBucketFiles() {
    setLoadingFiles(true);
    setStorageStatus(null);
    try {
      const { data, error } = await supabase.storage.from(bucketName).list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
      
      if (error) {
        throw error;
      }
      setBucketFiles(data || []);
    } catch (err: any) {
      console.warn("Storage fetch error:", err);
      setBucketFiles([]);
      // Friendly helper guidance instead of locking error
      setStorageStatus({
        type: 'info',
        msg: `Storage bucket "${bucketName}" not created yet. Click "Configure & Initialize Bucket" below to set it up automatically.`
      });
    } finally {
      setLoadingFiles(false);
    }
  }

  // Create new bucket inside Supabase Storage Workspace
  async function createSupabaseBucket() {
    setLoadingFiles(true);
    setStorageStatus(null);
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) throw error;
      
      setStorageStatus({
        type: 'success',
        msg: `Bucket "${bucketName}" created securely in public mode! Ready to accept telemetry files.`
      });
      fetchBucketFiles();
    } catch (err: any) {
      console.error("Bucket creation failed:", err);
      setStorageStatus({
        type: 'error',
        msg: `Bucket creation error: ${err.message}. If permissions are restricted, log into your Supabase Console, navigate to Storage, and create a public bucket named "${bucketName}" manually.`
      });
    } finally {
      setLoadingFiles(false);
    }
  }

  // Upload selected physical file
  async function handleFileUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setStorageStatus(null);
    try {
      const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `uploaded_${Date.now()}_${sanitizedName}`;
      
      const { error } = await supabase.storage.from(bucketName).upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: true
      });
      
      if (error) throw error;
      
      setStorageStatus({
        type: 'success',
        msg: `Uploaded file "${uploadFile.name}" to cloud storage bucket folder "${bucketName}".`
      });
      setUploadFile(null);
      fetchBucketFiles();
    } catch (err: any) {
      console.error("Upload error:", err);
      setStorageStatus({
        type: 'error',
        msg: `Could not upload direct file: ${err.message}. Ensure the bucket is created and standard Storage RLS policies are enabled.`
      });
    } finally {
      setUploading(false);
    }
  }

  // Save manually written JSON details as a file in the active bucket
  async function handleSaveManualRecordsAsFile() {
    setUploading(true);
    setStorageStatus(null);
    try {
      // Validate JSON structure first
      const parsed = JSON.parse(manualJsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Target file content MUST be a valid JSON array of subscriber nodes.");
      }
      
      const blob = new Blob([manualJsonInput], { type: 'application/json' });
      const generatedFileName = `subscriber_batch_${Date.now()}.json`;
      
      const { error } = await supabase.storage.from(bucketName).upload(generatedFileName, blob, {
        contentType: 'application/json',
        upsert: true
      });
      
      if (error) throw error;
      
      setStorageStatus({
        type: 'success',
        msg: `Customer details telemetry file "${generatedFileName}" uploaded successfully!`
      });
      fetchBucketFiles();
    } catch (err: any) {
      console.error("Save failure:", err);
      setStorageStatus({
        type: 'error',
        msg: `Save error: ${err.message}. Please verify syntax spelling.`
      });
    } finally {
      setUploading(false);
    }
  }

  // Delete file from bucket
  async function deleteBucketFile(fileName: string) {
    if (!confirm(`Purge remote file "${fileName}" permanently?`)) return;
    setStorageStatus(null);
    try {
      const { error } = await supabase.storage.from(bucketName).remove([fileName]);
      if (error) throw error;
      setStorageStatus({
        type: 'success',
        msg: `Deleted file "${fileName}" from remote bucket.`
      });
      fetchBucketFiles();
    } catch (err: any) {
      console.error("Deletion failure:", err);
      setStorageStatus({
        type: 'error',
        msg: `Could not execute remote delete: ${err.message}`
      });
    }
  }

  // Import subscriber nodes from a downloaded JSON file inside the bucket
  async function handleImportFile(fileName: string) {
    setStorageStatus(null);
    try {
      const { data, error } = await supabase.storage.from(bucketName).download(fileName);
      if (error) throw error;
      
      const text = await data.text();
      const parsed = JSON.parse(text);
      const importedList: any[] = Array.isArray(parsed) ? parsed : [parsed];
      let importCount = 0;

      for (const item of importedList) {
        if (item && item.name) {
          const finalItem: Customer = {
            id: item.id || `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: item.name,
            tenure: Number(item.tenure) || 12,
            monthlyUsage: Number(item.monthlyUsage) || 30,
            rechargeAmount: Number(item.rechargeAmount) || 45,
            planType: item.planType || 'Standard',
            contractType: item.contractType || 'Month-to-month',
            supportCalls: Number(item.supportCalls) || 2,
            churnProbability: Number(item.churnProbability) || 30,
            willChurn: item.willChurn !== undefined ? !!item.willChurn : false,
            riskFactors: Array.isArray(item.riskFactors) ? item.riskFactors : ['Imported from Cloud Bucket File']
          };
          onSaveCustomer(finalItem);
          importCount++;
        }
      }

      setStorageStatus({
        type: 'success',
        msg: `CRM Dynamic Update: Successfully loaded, parsed, and synced ${importCount} customers from file "${fileName}"!`
      });
    } catch (err: any) {
      console.error("Import failure:", err);
      setStorageStatus({
        type: 'error',
        msg: `Could not parse and map this file: ${err.message}`
      });
    }
  }

  // Run list retrieve inquiry on mount or when bucket configuration shifts
  useEffect(() => {
    fetchBucketFiles();
  }, [bucketName]);

  // Helper converter to write tenure in months / years
  const formatTenure = (months: number) => {
    if (months < 12) {
      return `${months} mos`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    }
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  };

  // Safe color indicator mapping
  // Green -> Low Risk (< 30)
  // Yellow -> Medium Risk (30 - 69)
  // Red -> High Risk (>= 70)
  const getRiskClassification = (prob: number) => {
    if (prob < 30) return { label: 'Low Risk', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25', dotClass: 'bg-emerald-500' };
    if (prob < 70) return { label: 'Medium Risk', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/25', dotClass: 'bg-amber-500' };
    return { label: 'High Risk', badgeClass: 'bg-rose-500/10 text-rose-500 border border-rose-500/25', dotClass: 'bg-rose-500' };
  };

  // Filter & Search Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // 1. Case-insensitive Search by Name or ID
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        customer.name.toLowerCase().includes(query) || 
        customer.id.toLowerCase().includes(query);

      // 2. Filter by PlanType
      const matchesPlan = 
        selectedPlanFilter === 'all' || 
        customer.planType.toLowerCase() === selectedPlanFilter.toLowerCase();

      // 3. Filter by Risk Label
      let matchesRisk = true;
      if (selectedRiskFilter !== 'all') {
        const prob = customer.churnProbability;
        if (selectedRiskFilter === 'low') matchesRisk = prob < 30;
        else if (selectedRiskFilter === 'medium') matchesRisk = prob >= 30 && prob < 70;
        else if (selectedRiskFilter === 'high') matchesRisk = prob >= 70;
      }

      return matchesSearch && matchesPlan && matchesRisk;
    });
  }, [customers, searchQuery, selectedPlanFilter, selectedRiskFilter]);

  // Sorting Process
  const sortedAndFilteredCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    list.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === 'spend') {
        valA = a.rechargeAmount;
        valB = b.rechargeAmount;
      } else if (sortBy === 'tenure') {
        valA = a.tenure;
        valB = b.tenure;
      } else if (sortBy === 'risk') {
        valA = a.churnProbability;
        valB = b.churnProbability;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCustomers, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'spend' | 'tenure' | 'risk') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Safe Insertion to ensure no duplicates and unique ID
  const handleAddNewSubscriberSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const autoName = newName.trim() || generateUniqueIndianName(customers.map(c => c.name));

    // Uniqueness constraint check (Case-insensitive name verify)
    const exists = customers.some(c => c.name.toLowerCase() === autoName.toLowerCase());
    if (exists) {
      setFormError(`A subscriber with the identifier "${autoName}" already exists. Please enter a unique name.`);
      return;
    }

    // Dynamic heuristic classifier calculations on the spot
    let score = 25; // baseline index
    if (newTenure < 6) score += 20;
    else if (newTenure < 18) score += 10;
    
    if (newSupport > 4) score += 30;
    else if (newSupport > 2) score += 15;

    if (newSpend > 100) score += 10;
    if (newUsage > 120) score += 10;

    const finalScore = Math.min(Math.max(score, 5), 98);
    const willChurn = finalScore >= 50;

    const mockRiskFactors = [];
    if (newTenure < 12) mockRiskFactors.push('Brief Tenure Anchor');
    if (newSupport > 3) mockRiskFactors.push('Extreme Support Friction');
    if (newSpend > 85) mockRiskFactors.push('High Premium Monthly Cost');

    const generatedId = 'TEL-' + Math.floor(100000 + Math.random() * 900000);

    const newCust: Customer = {
      id: generatedId,
      name: autoName,
      tenure: newTenure,
      monthlyUsage: newUsage,
      rechargeAmount: newSpend,
      planType: newPlan,
      contractType: newTenure < 12 ? 'Month-to-month' : 'One year',
      supportCalls: newSupport,
      churnProbability: finalScore,
      willChurn,
      riskFactors: mockRiskFactors
    };

    onSaveCustomer(newCust);
    setNewName('');
    setFormError(null);
    setAddFormOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      {/* Sync database prompt banner */}
      {!user && onConnectCloudDatabase && (
        <div className="bg-slate-900/60 border border-amber-500/10 hover:border-amber-500/25 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl mt-0.5 shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Connect Cloud Database</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Unlock direct cloud logging, remote bucket storage, and historical synchronized analysis. Connect safely to your live Supabase database with pre-filled test credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onConnectCloudDatabase}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-350 hover:shadow-lg hover:shadow-amber-500/10 rounded-xl transition cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Connect Cloud Database</span>
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl font-sans">
        
        {/* Top Header Row of registry details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Subscriber Registry & Info Center
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/15">
                {sortedAndFilteredCustomers.length} Records Shown
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Manage, search, filter and inspect subscriber records directly. Values remain synchronized in memory and to Supabase database.
            </p>
          </div>

          <button
            onClick={() => setAddFormOpen(!addFormOpen)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-950 border border-blue-900/50 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {addFormOpen ? <X className="w-3.5 h-3.5" /> : <FileCheck className="w-3.5 h-3.5" />}
            <span>{addFormOpen ? 'Close New Form' : 'Register Subscriber'}</span>
          </button>
        </div>

        {/* Dynamic add form overlay context inside customer page details as requested */}
        <AnimatePresence>
          {addFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={handleAddNewSubscriberSubmit} className="bg-slate-950/80 border border-slate-850 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-900/60">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">New Subscriber Form (Auto-Unique ID Assigned)</span>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name field */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subscriber Name</label>
                      <button
                        type="button"
                        onClick={() => setNewName(generateUniqueIndianName(customers.map(c => c.name)))}
                        className="text-[9px] font-bold text-blue-400 hover:text-blue-350 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        Suggest Indian Name
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Aarav Sharma (or leave blank to auto-generate)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Plan selector */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plan Level</label>
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value as PlanType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>

                  {/* Tenure length slider */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tenure Length ({newTenure} months)</label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={newTenure}
                      onChange={(e) => setNewTenure(Number(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900/60 pt-3">
                  {/* Monthly spend */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Spend (${newSpend} USD)</label>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      value={newSpend}
                      onChange={(e) => setNewSpend(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>

                  {/* Monthly Usage */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Usage ({newUsage} GB Data)</label>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={newUsage}
                      onChange={(e) => setNewUsage(Number(e.target.value))}
                      className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>

                  {/* Customer support requests */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Support Requests ({newSupport} total)</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newSupport}
                      onChange={(e) => setNewSupport(Number(e.target.value))}
                      className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Confirm & Store Subscriber
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search, filters, sorting controls layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Column A: Search */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriber by Name or Customer ID (case-insensitive)..."
              className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-slate-700 text-slate-200 text-xs pl-10 pr-4 py-3 rounded-xl transition"
            />
          </div>

          {/* Column B: Plan Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Plan:</span>
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Plan Levels</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          {/* Column C: Risk Filter */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Risk Zone:</span>
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Green (Low Risk &lt; 30%)</option>
              <option value="medium">Yellow (Medium Risk 30-69%)</option>
              <option value="high">Red (High Risk ≥ 70%)</option>
            </select>
          </div>
        </div>

        {/* Sorted indicators guidance */}
        <div className="flex flex-wrap items-center gap-5 mb-4 text-[10px] text-slate-500 font-medium">
          <span>Sort options (Click header to toggle order):</span>
          <button 
            type="button" 
            onClick={() => toggleSort('name')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'name' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('tenure')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'tenure' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Tenure {sortBy === 'tenure' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('spend')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'spend' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Spend {sortBy === 'spend' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('risk')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'risk' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Churn Risk {sortBy === 'risk' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
        </div>

        {/* Primary Customer Table registry info */}
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-4">Subscriber Name</th>
                <th className="py-4 px-4">Customer ID</th>
                <th className="py-4 px-4">Plan Type</th>
                <th className="py-4 px-4">Monthly Usage (Data)</th>
                <th className="py-4 px-4">Monthly Spend</th>
                <th className="py-4 px-4">Tenure duration</th>
                <th className="py-4 px-4">Support Requests</th>
                <th className="py-4 px-4">Churn Status</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {sortedAndFilteredCustomers.map((customer) => {
                const diagnosis = getRiskClassification(customer.churnProbability);
                return (
                  <tr key={customer.id} className="transition-colors hover:bg-slate-850/45">
                    {/* Subscriber Name */}
                    <td className="py-3 px-4 font-bold text-slate-250 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-[10px] text-blue-405 font-bold uppercase">
                        {customer.name.slice(0, 2)}
                      </div>
                      <span className="truncate max-w-[150px]" title={customer.name}>{customer.name}</span>
                    </td>

                    {/* Customer ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                      {customer.id}
                    </td>

                    {/* Plan Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold text-slate-400 rounded-md">
                        {customer.planType}
                      </span>
                    </td>

                    {/* Monthly Usage */}
                    <td className="py-3 px-4">
                      <span className="text-teal-400 font-bold">{customer.monthlyUsage.toFixed(1)} GB</span>
                      <span className="text-[10px] text-slate-500 block">Cellular data & calls</span>
                    </td>

                    {/* Monthly Spend */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">
                      ${customer.rechargeAmount.toFixed(2)}
                    </td>

                    {/* Tenure (months/years) */}
                    <td className="py-3 px-4 text-slate-400 font-medium">
                      {formatTenure(customer.tenure)}
                      <span className="text-[9px] text-slate-600 block">({customer.tenure} total mos)</span>
                    </td>

                    {/* Support Requests */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                        customer.supportCalls >= 4 
                          ? 'bg-rose-500/10 text-rose-455 font-black border border-rose-500/15' 
                          : 'bg-slate-950 text-slate-400'
                      }`}>
                        {customer.supportCalls}
                      </span>
                    </td>

                    {/* Churn Status (Color code indicator) */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${diagnosis.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${diagnosis.dotClass} animate-pulse`} />
                        {diagnosis.label} ({customer.churnProbability}%)
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Remove subscriber "${customer.name}"?`)) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 bg-slate-950 border border-slate-850 hover:border-rose-500/30 hover:text-rose-400 rounded-lg transition shrink-0 cursor-pointer text-slate-500"
                        title="Purge record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {sortedAndFilteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-550 font-medium">
                    No results found matching search coordinates or filter state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* --- SUPABASE STORAGE CONTROL PANEL & MANUALLY DRAFT DATASET SECTION --- */}
      <div className="mt-8 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5 mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 mb-2">
              <Database className="w-3 h-3" />
              Object Storage Integrator
            </span>
            <h3 className="text-lg font-bold text-slate-50 tracking-tight">
              Supabase Storage Buckets & File Importer
            </h3>
            <p className="text-xs text-slate-450 mt-1 max-w-2xl leading-relaxed">
              Configure remote directories, save manually drafted details as raw files directly onto Supabase, or parse files to import fresh cohorts securely into the active telemetry list.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBucketFiles}
              disabled={loadingFiles}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
              <span>Refresh Files</span>
            </button>
          </div>
        </div>

        {/* Dynamic Warning Alert Messages banner */}
        {storageStatus && (
          <div className={`mb-6 p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            storageStatus.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : storageStatus.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-405'
          }`}>
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                {storageStatus.type === 'success' ? 'Task Succeeded' : storageStatus.type === 'error' ? 'Storage Response Warning' : 'System Note'}
              </span>
              <p className="leading-relaxed">{storageStatus.msg}</p>
            </div>
          </div>
        )}

        {/* Bucket Configuration panel row */}
        <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Target Supabase Storage Bucket Name
            </label>
            <div className="flex max-w-md gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 font-mono text-xs">
                  bucket/
                </span>
                <input
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="telecom-details"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 focus:outline-none text-slate-200 text-xs font-mono pl-16 pr-4 py-3 rounded-xl transition"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Only alphanumeric characters, dashes, and underscores allowed. Default bucket: <code className="text-slate-400 font-mono">telecom-details</code>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={createSupabaseBucket}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-blue-500/10 border border-blue-500/25 hover:border-blue-500/40 text-blue-400 rounded-xl transition cursor-pointer"
              title="Sends schema call to automatically provision bucket"
            >
              <FolderPlus className="w-4 h-4 shrink-0" />
              <span>Configure & Initialize Bucket</span>
            </button>
          </div>
        </div>

        {/* Main Double column area for file list + editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column A: Files Library & Manual upload (Left 7-grids) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Upload File Desk */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Upload Document or Sheet</span>
              </h4>

              <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition relative">
                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-350 font-medium">
                  {uploadFile ? (
                    <span className="text-emerald-400 font-bold">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    <span>Click or drag your local .json, .csv, or .txt data profile here</span>
                  )}
                </p>
                <span className="text-[10px] text-slate-550 block mt-1">Acceptable size limit: 5MB</span>
              </div>

              {uploadFile && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setUploadFile(null)}
                    className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-extrabold text-slate-950 bg-blue-400 hover:bg-blue-350 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition cursor-pointer"
                  >
                    {uploading ? 'Processing_...' : 'Push to Remote Bucket'}
                  </button>
                </div>
              )}
            </div>

            {/* List online items inside bucket */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span>Bucket Collection: <code className="text-blue-300 font-mono text-[11px]">{bucketName}</code></span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium font-mono">{bucketFiles.length} files tracked</span>
              </h4>

              {loadingFiles ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <div className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Inquiring online file dictionary...</p>
                </div>
              ) : bucketFiles.length === 0 ? (
                <div className="py-8 bg-slate-900/30 border border-slate-900 rounded-xl text-center text-slate-500 text-xs leading-relaxed p-4">
                  No records stored here yet. Upload a local file, or write customer records on the right and hit "Save to Bucket".
                </div>
              ) : (
                <div className="border border-slate-900 rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-850 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">File Key</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {bucketFiles.map((file) => {
                        const isJson = file.name.endsWith('.json');
                        return (
                          <tr key={file.id || file.name} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-350 truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {isJson ? (
                                  <button
                                    onClick={() => handleImportFile(file.name)}
                                    className="px-2 py-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 hover:border-emerald-500/25 rounded-md transition cursor-pointer"
                                    title="Import file arrays dynamically into active simulated client CRM list."
                                  >
                                    Import CRM
                                  </button>
                                ) : (
                                  <span className="text-[9px] px-1 text-slate-600 bg-slate-950 rounded">RAW text</span>
                                )}
                                
                                <button
                                  onClick={() => deleteBucketFile(file.name)}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-md transition cursor-pointer"
                                  title="Delete from bucket"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Column B: Interactive File drafting editor (Right 5-grids) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-yellow-500" />
                  <span>Draft Details Manually (JSON file)</span>
                </h4>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Valid array
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-normal">
                Expand or rewrite this subscriber checklist array template manually. When completed, write it straight onto your online Supabase Bucket as a raw JSON asset!
              </p>

              <div>
                <textarea
                  value={manualJsonInput}
                  onChange={(e) => setManualJsonInput(e.target.value)}
                  placeholder="[ { 'name': '...' } ]"
                  rows={9}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 focus:outline-none text-slate-300 font-mono text-[10px] p-3 rounded-xl transition select-all scrollbar"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      JSON.parse(manualJsonInput);
                      alert("Syntax validation passed! This is a valid JSON structured array.");
                    } catch (err: any) {
                      alert(`JSON invalid: ${err.message}`);
                    }
                  }}
                  className="px-2.5 py-1.5 text-[9px] font-bold text-slate-450 hover:bg-slate-900 border border-slate-850 rounded-lg transition"
                >
                  Verify Format
                </button>

                <button
                  onClick={handleSaveManualRecordsAsFile}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-blue-400 hover:bg-blue-350 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Save file to Bucket</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* GUIDES AND HELPERS TO PROCEED ACCORDINGLY */}
        <div className="mt-8 pt-6 border-t border-slate-850/60">
          <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>How to Proceed & Enable Custom Buckets in your Supabase Console:</span>
          </h4>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-slate-450 text-[11px] leading-relaxed space-y-3">
            <p>
              Supabase Object Storage requires clean permission keys and security rules to accept files outside authorized sessions. To ensure files flow smoothly between this client and your database, perform these fast steps:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-400">
              <li>
                <strong>Create the Bucket</strong>: Log into your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a>, click the <strong>Storage</strong> drawer icon, choose <strong>New Bucket</strong>, name it spelling <code className="text-blue-300">telecom-details</code>, and toggled <strong>Public</strong> to <span className="text-emerald-400 font-bold">Enabled</span>.
              </li>
              <li>
                <strong>Configure Storage RLS Policies</strong>: Under your Storage menu, click on <strong>Policies</strong>. Add a custom policy on the <code className="text-slate-300">objects</code> table inside the bucket to ensure write operations succeed:
                <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg border border-slate-800 font-mono text-[9px] overflow-x-auto mt-1.5">
                  -- Enable INSERT/SELECT policy for anonymous/public uploads:<br />
                  create policy "Allow Public Storage Access" on storage.objects for all using (true) with check (true);
                </div>
              </li>
              <li>
                <strong>Manually Edit & Upload Details</strong>: You can dragging / upload any local spreadsheet (.csv) or text list. Additionally, you are able to use our live raw JSON compiler on the right for instant authoring, cloud verification, and direct parsing back onto the CRM screen dynamically!
              </li>
            </ol>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
