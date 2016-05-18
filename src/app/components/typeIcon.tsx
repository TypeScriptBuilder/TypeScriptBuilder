import {IconType, DocumentedType} from "../../common/types";

/**
 * This maps into the iconTypes.svg [x,y]
 *
 * (0,0)-------x
 * |
 * |
 * y
 *
 */
const iconLocations = {
    [IconType.Global]: { x: 10, y: 0 },

    [IconType.Namespace]: { x: 0, y: 6 },
    [IconType.Variable]: { x: 0, y: 1 },
    [IconType.Function]: { x: 8, y: 4 },
    [IconType.FunctionGeneric]: { x: 8, y: 5 },

    [IconType.Enum]: { x: 0, y: 7 },
    [IconType.EnumMember]: { x: 0, y: 8 },

    [IconType.Interface]: { x: 0, y: 4 },
    [IconType.InterfaceGeneric]: { x: 0, y: 5 },
    [IconType.InterfaceConstructor]: { x: 12, y: 6 },
    [IconType.InterfaceProperty]: { x: 12, y: 0 },
    [IconType.InterfaceMethod]: { x: 12, y: 4 },
    [IconType.InterfaceMethodGeneric]: { x: 12, y: 5 },
    [IconType.InterfaceIndexSignature]: { x: 12, y: 7 },

    [IconType.Class]: { x: 0, y: 2 },
    [IconType.ClassGeneric]: { x: 0, y: 3 },
    [IconType.ClassConstructor]: { x: 3, y: 6 },
    [IconType.ClassProperty]: { x: 3, y: 0 },
    [IconType.ClassMethod]: { x: 3, y: 4 },
    [IconType.ClassMethodGeneric]: { x: 3, y: 5 },
    [IconType.ClassIndexSignature]: { x: 3, y: 7 },
}
const _typeIconLocations: { [key: number]: { x: number, y: number } } = iconLocations;

import * as ui from "../ui";
import * as React from "react";
import * as pure from "../../common/pure";
import * as csx from "csx";
import * as styles from "../styles/styles";

interface Props {
    iconType: IconType
}
interface State {

}

namespace TypeIconStyles {
    export const spriteSize = 17; // px

    /** We want to eat a bit of the icon otherwise we get neighbours at certain scales */
    export const iconClipWidth = 1;

    export const root = {
        width: `${spriteSize - iconClipWidth}px`,
        height: `${spriteSize}px`,
        display: 'inline-block',
    }
}

/**
 * Draws the icon for a type
 */
export class TypeIcon extends ui.BaseComponent<Props, State>{
    shouldComponentUpdate = pure.shouldComponentUpdate;
    render() {
        const imageLocation = iconLocations[this.props.iconType];
        const left = imageLocation.x * -TypeIconStyles.spriteSize - TypeIconStyles.iconClipWidth;
        const top = imageLocation.y * -TypeIconStyles.spriteSize;
        const backgroundImage = 'url(assets/typeIcons.svg)';
        const backgroundPosition = `${left}px ${top}px`;
        const style = csx.extend(TypeIconStyles.root, { backgroundImage, backgroundPosition });
        return <div style={style}></div>;
    }
}

/**
 * Draws the icon followed by name
 */
namespace DocumentedTypeHeaderStyles {
    export const root = csx.extend(
        {
            fontWeight: 'bold',
            fontSize: '.6rem',
            color: styles.textColor,

            // Center
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'pre'
        });
}
export class DocumentedTypeHeader extends ui.BaseComponent<{ name: string, icon: IconType }, State>{
    shouldComponentUpdate = pure.shouldComponentUpdate;
    render() {
        return <div style={DocumentedTypeHeaderStyles.root}><TypeIcon iconType={this.props.icon}/>{" " + this.props.name}</div>
    }
}

export const SectionHeader = (props:{text:string}) => {
    return <div
        style={{ fontSize: '1rem', fontWeight: 'bold'}}>
    {props.text}
    </div>
}

/**
 * Draws the legend
 */
namespace TypeIconLegendStyles {
    export const root = csx.extend(
        {
            fontWeight: 'bold',
            fontSize: '.6rem',
            color: styles.textColor,
        });
    export const legendColumnContainer = csx.horizontal;
    export const legendColumn = csx.extend(
        csx.vertical,
        {
            padding: '10px'
        });
}
export class TypeIconLegend extends ui.BaseComponent<{}, {}>{
    render() {
        return (
            <div style={TypeIconLegendStyles.root}>
                <div style={{paddingLeft: '10px'}}><SectionHeader text="Legend"/></div>
                <div style={TypeIconLegendStyles.legendColumnContainer}>
                    <div style={TypeIconLegendStyles.legendColumn}>
                        <DocumentedTypeHeader name={"Global"} icon={IconType.Global}/>

                        <DocumentedTypeHeader name={"Namespace"} icon={IconType.Namespace}/>
                        <DocumentedTypeHeader name="Variable" icon={IconType.Variable}/>
                        <DocumentedTypeHeader name="Function" icon={IconType.Function}/>
                        <DocumentedTypeHeader name="Function Generic" icon={IconType.FunctionGeneric}/>

                        <div style={{ height: TypeIconStyles.spriteSize + 'px' }}/>

                        <DocumentedTypeHeader name="Enum" icon={IconType.Enum}/>
                        <DocumentedTypeHeader name="Enum Member" icon={IconType.EnumMember}/>
                    </div>
                    <div style={TypeIconLegendStyles.legendColumn}>
                        <DocumentedTypeHeader name="Interface" icon={IconType.Interface}/>
                        <DocumentedTypeHeader name="Interface Generic" icon={IconType.InterfaceGeneric}/>
                        <DocumentedTypeHeader name="Interface Constructor" icon={IconType.InterfaceConstructor}/>
                        <DocumentedTypeHeader name="Interface Property" icon={IconType.InterfaceProperty}/>
                        <DocumentedTypeHeader name="Interface Method" icon={IconType.InterfaceMethod}/>
                        <DocumentedTypeHeader name="Interface Method Generic" icon={IconType.InterfaceMethodGeneric}/>
                        <DocumentedTypeHeader name="Interface Index Signature" icon={IconType.InterfaceIndexSignature}/>
                    </div>
                    <div style={TypeIconLegendStyles.legendColumn}>
                        <DocumentedTypeHeader name="Class" icon={IconType.Class}/>
                        <DocumentedTypeHeader name="Class Generic" icon={IconType.ClassGeneric}/>
                        <DocumentedTypeHeader name="Class Constructor" icon={IconType.ClassConstructor}/>
                        <DocumentedTypeHeader name="Class Property" icon={IconType.ClassProperty}/>
                        <DocumentedTypeHeader name="Class Method" icon={IconType.ClassMethod}/>
                        <DocumentedTypeHeader name="Class Method Generic" icon={IconType.ClassMethodGeneric}/>
                        <DocumentedTypeHeader name="Class Index Signature" icon={IconType.ClassIndexSignature}/>
                    </div>
                </div>
            </div>
        );
    }
}
