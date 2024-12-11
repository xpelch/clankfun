"use client"

type FButtonProps = {
  primary?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  selected?: boolean;
}

const primaryStyles = {
  containerStyle: 'cursor-pointer h-[30px] px-2 bg-white/90 rounded-lg justify-center items-center gap-2 inline-flex text-black text-[15px] font-medium leading-[15px]'
}

const secondaryStyles = {
  containerStyle: 'cursor-pointer h-[30px] px-2 rounded-lg justify-center items-center gap-2 inline-flex hover:bg-white/20 text-white text-[15px] font-medium leading-[15px]'
}

export function FButton({ primary = false, onClick, children, selected = false }: FButtonProps) {
  const styles = primary ? primaryStyles : secondaryStyles;
  const containerStyle = `${styles.containerStyle} ${selected ? 'bg-white/10' : ''}`;

  return (
    <div className={containerStyle} onClick={onClick}>
      {children}
    </div>
  )
}