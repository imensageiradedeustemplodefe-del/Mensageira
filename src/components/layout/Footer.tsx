import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mensageira de Deus Templo de Fé | Desenvolvido por{" "}
            <span className="font-medium text-primary">Palavra Viva</span>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link href="/privacidade" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
