/// <summary>
/// All the partners of which we are aware (for authentication purposes).
///		Comaintain with iXRAnalytics.cs.
/// </summary>
export enum Partner
{
    eNone,
    eArborXR
};
export function PartnerToString(ePartner: Partner): string
{
    switch (ePartner)
    {
    case Partner.eArborXR:
        return "arborxr";
    default:
        break;
    }
    return "";
}
export function StringToPartner(szString: string): Partner
{
    switch (szString)
    {
    case "arborxr":
        return Partner.eArborXR;
    default:
        break;
    }
    return Partner.eNone;
}
