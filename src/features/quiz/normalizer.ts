export function normalize(input: string): string {
  let result = input;

  result = result.normalize('NFKC');
  
  result = result.trim();
  
  result = result.replace(/\s+/g, ' ');
  
  result = result.replace(/[。、！？\u3000]/g, '');
  
  result = result.toLowerCase();
  
  result = result.replace(/[ァ-ヾ]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });

  return result;
}