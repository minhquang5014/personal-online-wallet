import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as api from './api';
import { useAuth } from './AuthContext';
import { usePrefs } from './PrefsContext';
import { Category, Member, MemberRole, Transaction, TransactionWithCategory } from './types';

interface WalletContextValue {
  /** Đã nạp xong dữ liệu của ví hiện tại chưa. */
  ready: boolean;
  wallets: api.Wallet[];
  wallet: api.Wallet | null;
  members: Member[];
  categories: Category[];
  transactions: TransactionWithCategory[];
  myRole: MemberRole | null;

  refresh: () => Promise<void>;
  selectWallet: (id: string) => Promise<void>;
  createWallet: (name: string) => Promise<api.Wallet>;
  joinWallet: (code: string) => Promise<api.Wallet>;
  renameWallet: (id: string, name: string) => Promise<void>;
  leaveWallet: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  addTransaction: (input: Omit<Transaction, 'id' | 'createdBy'>) => Promise<void>;
  updateTransaction: (id: string, input: Omit<Transaction, 'id' | 'createdBy'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  /** Quyền sửa/xoá — khớp với RLS ở database (xem 0003_permissions.sql). */
  canEdit: (tx: Transaction) => boolean;
}

const noop = async () => {};
// Chỉ là giá trị mặc định của context (không bao giờ chạy thật vì luôn có Provider).
const noWallet = async () => {
  throw new Error('WalletProvider chưa sẵn sàng');
};

const WalletContext = createContext<WalletContextValue>({
  ready: false,
  wallets: [],
  wallet: null,
  members: [],
  categories: [],
  transactions: [],
  myRole: null,
  refresh: noop,
  selectWallet: noop,
  createWallet: noWallet,
  joinWallet: noWallet,
  renameWallet: noop,
  leaveWallet: noop,
  removeMember: noop,
  addTransaction: noop,
  updateTransaction: noop,
  removeTransaction: noop,
  canEdit: () => false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { userId, loading: authLoading } = useAuth();
  const { prefs, ready: prefsReady, update } = usePrefs();

  const [ready, setReady] = useState(false);
  const [wallets, setWallets] = useState<api.Wallet[]>([]);
  const [wallet, setWallet] = useState<api.Wallet | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);

  const myRole = userId ? (members.find((m) => m.id === userId)?.role ?? null) : null;

  /** Nạp toàn bộ dữ liệu của một ví (3 request song song). */
  const loadWallet = useCallback(async (w: api.Wallet) => {
    const [cats, mems] = await Promise.all([api.fetchCategories(), api.fetchMembers(w.id)]);
    const txs = await api.fetchTransactionsWithCategory(w.id, cats);
    setCategories(cats);
    setMembers(mems);
    setTransactions(txs);
  }, []);

  /** Nạp danh sách ví rồi mở ví đang chọn (hoặc ví đầu tiên). */
  const bootstrap = useCallback(async () => {
    if (!userId) {
      setWallets([]);
      setWallet(null);
      setMembers([]);
      setCategories([]);
      setTransactions([]);
      setReady(true);
      return;
    }

    setReady(false);
    const ws = await api.fetchMyWallets();
    setWallets(ws);

    const picked = ws.find((w) => w.id === prefs.walletId) ?? ws[0] ?? null;
    setWallet(picked);

    if (picked) {
      if (picked.id !== prefs.walletId) await update({ walletId: picked.id });
      await loadWallet(picked);
    }
    setReady(true);
    // `prefs.walletId` cố tình không nằm trong deps: chỉ dùng làm giá trị khởi tạo,
    // nếu thêm vào sẽ chạy lại bootstrap mỗi lần đổi ví.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadWallet, update]);

  useEffect(() => {
    // Phải chờ prefs đọc xong từ máy: bootstrap dùng `prefs.walletId` để chọn ví,
    // chạy sớm sẽ thấy '' -> chọn ví đầu tiên rồi GHI ĐÈ lựa chọn đã lưu.
    if (authLoading || !prefsReady) return;
    bootstrap().catch(() => setReady(true));
  }, [authLoading, prefsReady, bootstrap]);

  const refresh = useCallback(async () => {
    if (wallet) await loadWallet(wallet);
  }, [wallet, loadWallet]);

  const selectWallet = useCallback(
    async (id: string) => {
      const w = wallets.find((x) => x.id === id);
      if (!w) return;
      setWallet(w);
      await update({ walletId: w.id });
      await loadWallet(w);
    },
    [wallets, update, loadWallet]
  );

  const createWallet = useCallback(
    async (name: string) => {
      const w = await api.createWallet(name);
      setWallets((cur) => [...cur, w]);
      setWallet(w);
      await update({ walletId: w.id });
      await loadWallet(w);
      return w;
    },
    [update, loadWallet]
  );

  const joinWallet = useCallback(
    async (code: string) => {
      const w = await api.joinWallet(code);
      setWallets((cur) => (cur.some((x) => x.id === w.id) ? cur : [...cur, w]));
      setWallet(w);
      await update({ walletId: w.id });
      await loadWallet(w);
      return w;
    },
    [update, loadWallet]
  );

  const renameWallet = useCallback(async (id: string, name: string) => {
    await api.renameWallet(id, name);
    setWallets((cur) => cur.map((w) => (w.id === id ? { ...w, name } : w)));
    setWallet((cur) => (cur && cur.id === id ? { ...cur, name } : cur));
  }, []);

  const leaveWallet = useCallback(async () => {
    if (!wallet) return;
    await api.leaveWallet(wallet.id);
    const remaining = wallets.filter((w) => w.id !== wallet.id);
    setWallets(remaining);
    const next = remaining[0] ?? null;
    setWallet(next);
    await update({ walletId: next?.id ?? '' });
    if (next) {
      await loadWallet(next);
    } else {
      setMembers([]);
      setCategories([]);
      setTransactions([]);
    }
  }, [wallet, wallets, update, loadWallet]);

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!wallet) return;
      await api.removeMember(wallet.id, memberId);
      setMembers((cur) => cur.filter((m) => m.id !== memberId));
    },
    [wallet]
  );

  const addTransaction = useCallback(
    async (input: Omit<Transaction, 'id' | 'createdBy'>) => {
      if (!wallet) throw new Error('Chưa chọn ví');

      const tx = await api.addTransaction({
        walletId: wallet.id,
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        note: input.note,
        occurredAt: input.date,
      });

      // Ghép tại chỗ từ dữ liệu đã có sẵn thay vì nạp lại cả ví — insert đã trả
      // về id thật, còn danh mục và người nhập thì đang nằm trong state rồi.
      const category = categories.find((c) => c.id === tx.categoryId);
      const creator = members.find((m) => m.id === tx.createdBy);
      if (!category || !creator) {
        await loadWallet(wallet); // dữ liệu lệch (hiếm) -> đọc lại cho chắc
        return;
      }

      setTransactions((cur) =>
        [{ ...tx, category, creator }, ...cur].sort((a, b) => +new Date(b.date) - +new Date(a.date))
      );
    },
    [wallet, categories, members, loadWallet]
  );

  const updateTransaction = useCallback(
    async (id: string, input: Omit<Transaction, 'id' | 'createdBy'>) => {
      await api.updateTransaction(id, {
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        note: input.note,
        occurredAt: input.date,
      });
      const category = categories.find((c) => c.id === input.categoryId);
      setTransactions((cur) =>
        cur
          .map((t) =>
            t.id === id
              ? {
                  ...t,
                  amount: input.amount,
                  type: input.type,
                  categoryId: input.categoryId,
                  note: input.note,
                  date: input.date,
                  category: category ?? t.category,
                }
              : t
          )
          .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      );
    },
    [categories]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await api.deleteTransaction(id);
      setTransactions((cur) => cur.filter((t) => t.id !== id));
    },
    []
  );

  const canEdit = useCallback(
    (tx: Transaction) => myRole === 'owner' || tx.createdBy === userId,
    [myRole, userId]
  );

  return (
    <WalletContext.Provider
      value={{
        ready,
        wallets,
        wallet,
        members,
        categories,
        transactions,
        myRole,
        refresh,
        selectWallet,
        createWallet,
        joinWallet,
        renameWallet,
        leaveWallet,
        removeMember,
        addTransaction,
        updateTransaction,
        removeTransaction,
        canEdit,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
